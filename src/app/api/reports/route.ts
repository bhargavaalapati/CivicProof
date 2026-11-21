import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { CreateReportInputSchema } from "@/lib/domain/locality";
import { sanitizeAndPrepareEvidence } from "@/lib/security/media";

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*, evidence(id, phase, has_pii_flag, created_at)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load reports." }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const rawInput = {
      category: formData.get("category"),
      title: formData.get("title"),
      description: formData.get("description"),
      lat: formData.get("lat"),
      lng: formData.get("lng"),
      landmark: formData.get("landmark") ?? "",
      external_ref_id: formData.get("external_ref_id") ?? "",
      external_status: formData.get("external_status") ?? "unknown",
      ai_consent_acknowledged: formData.get("ai_consent_acknowledged") === "true",
    };

    const parsed = CreateReportInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid report input." },
        { status: 400 }
      );
    }

    const photo = formData.get("before_photo");
    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json(
        { error: "An initial 'Before' photo is required to create a report." },
        { status: 400 }
      );
    }

    // 1. Insert report row first (RLS verifies owner_id = auth.uid())
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        owner_id: user.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Could not create report record." }, { status: 500 });
    }

    // 2. Validate magic bytes, strip EXIF/GPS, re-encode to JPEG
    const rawBuffer = Buffer.from(await photo.arrayBuffer());
    let sanitized;
    try {
      sanitized = await sanitizeAndPrepareEvidence({
        rawBuffer,
        userId: user.id,
        reportId: report.id,
        phase: "before",
      });
    } catch (mediaErr) {
      // Roll back orphan report if image failed safety checks
      await supabase.from("reports").delete().eq("id", report.id);
      return NextResponse.json(
        { error: mediaErr instanceof Error ? mediaErr.message : "Invalid image upload." },
        { status: 400 }
      );
    }

    // 3. Upload sanitized JPEG to private bucket
    const { error: uploadError } = await supabase.storage
      .from("civic-evidence")
      .upload(sanitized.storagePath, sanitized.jpegBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      await supabase.from("reports").delete().eq("id", report.id);
      return NextResponse.json({ error: "Failed to store evidence photo." }, { status: 500 });
    }

    // 4. Record evidence metadata + initial timeline event
    await supabase.from("evidence").insert({
      report_id: report.id,
      owner_id: user.id,
      phase: "before",
      storage_path: sanitized.storagePath,
      sha256_hash: sanitized.sha256Hash,
      mime_type: "image/jpeg",
      file_size_bytes: sanitized.sizeBytes,
      width: sanitized.width,
      height: sanitized.height,
    });

    await supabase.from("report_events").insert({
      report_id: report.id,
      owner_id: user.id,
      event_type: "report_created",
      summary: `Report created in ${parsed.data.category} with sanitized Before photo (EXIF stripped).`,
      metadata: {
        sha256_prefix: sanitized.sha256Hash.slice(0, 12),
        external_status: parsed.data.external_status,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}