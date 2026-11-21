import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sanitizeAndPrepareEvidence } from "@/lib/security/media";
import { EvidencePhaseSchema } from "@/lib/domain/contracts";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await context.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify explicit ownership of this report
  const { data: report } = await supabase
    .from("reports")
    .select("id, owner_id")
    .eq("id", reportId)
    .eq("owner_id", user.id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Report not found or access denied." }, { status: 404 });
  }

  const formData = await request.formData();
  const phaseParsed = EvidencePhaseSchema.safeParse(formData.get("phase") ?? "after");
  if (!phaseParsed.success) {
    return NextResponse.json({ error: "Invalid evidence phase." }, { status: 400 });
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "Please select an image file." }, { status: 400 });
  }

  try {
    const rawBuffer = Buffer.from(await photo.arrayBuffer());
    const sanitized = await sanitizeAndPrepareEvidence({
      rawBuffer,
      userId: user.id,
      reportId,
      phase: phaseParsed.data,
    });

    const { error: uploadError } = await supabase.storage
      .from("civic-evidence")
      .upload(sanitized.storagePath, sanitized.jpegBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Storage upload failed." }, { status: 500 });
    }

    const { data: evidenceRow, error: dbError } = await supabase
      .from("evidence")
      .insert({
        report_id: reportId,
        owner_id: user.id,
        phase: phaseParsed.data,
        storage_path: sanitized.storagePath,
        sha256_hash: sanitized.sha256Hash,
        mime_type: "image/jpeg",
        file_size_bytes: sanitized.sizeBytes,
        width: sanitized.width,
        height: sanitized.height,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: "Failed to save evidence metadata." }, { status: 500 });
    }

    // Optionally mark external status as marked_resolved if citizen is uploading a closure photo
    const markExternalResolved = formData.get("mark_external_resolved") === "true";
    if (markExternalResolved) {
      await supabase
        .from("reports")
        .update({ external_status: "marked_resolved", updated_at: new Date().toISOString() })
        .eq("id", reportId);
    }

    await supabase.from("report_events").insert({
      report_id: reportId,
      owner_id: user.id,
      event_type: `${phaseParsed.data}_evidence_attached`,
      summary: `Attached sanitized ${phaseParsed.data.toUpperCase()} photo (EXIF stripped, SHA-256 ${sanitized.sha256Hash.slice(0, 10)}…).`,
      metadata: { evidence_id: evidenceRow.id, mark_external_resolved: markExternalResolved },
    });

    return NextResponse.json({ evidence: evidenceRow }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image validation failed." },
      { status: 400 }
    );
  }
}