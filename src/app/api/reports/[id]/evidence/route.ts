import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sanitizeAndPrepareEvidence } from "@/lib/security/media";
import { EvidencePhaseSchema } from "@/lib/domain/contracts";
import { screenSingleUpload } from "@/lib/ai/intake-guard";

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

  const { data: report } = await supabase
    .from("reports")
    .select("id, owner_id, category")
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

    // 1. Duplicate Photo Fraud Check: block uploading the exact same image already on this report
    const { data: existingHashes } = await supabase
      .from("evidence")
      .select("id, phase, sha256_hash")
      .eq("report_id", reportId)
      .eq("owner_id", user.id);

    const dup = existingHashes?.find((row) => row.sha256_hash === sanitized.sha256Hash);
    if (dup) {
      return NextResponse.json(
        {
          error: `This exact photograph is already attached as the ${dup.phase.toUpperCase()} photo on this report. Please upload a newly captured follow-up image.`,
          error_code: "DUPLICATE_EVIDENCE_PHOTO",
        },
        { status: 422 }
      );
    }

    // 2. Multi-Signal Intake Gatekeeper (blocks non-civic items, screenshots, AI-generated fakes)
    const intake = await screenSingleUpload({
      jpegBuffer: sanitized.jpegBuffer,
      selectedCategory: report.category,
      phase: phaseParsed.data,
      hadExifMetadata: sanitized.hadExifMetadata,
    });

    if (!intake.allowed) {
      return NextResponse.json(
        {
          error: intake.rejectionReason ?? "Uploaded photo was rejected by civic intake screening.",
          error_code: intake.status.toUpperCase(),
        },
        { status: intake.status === "provider_unavailable" ? 503 : 422 }
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
        has_pii_flag: intake.piiFlagged,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: "Failed to save evidence metadata." }, { status: 500 });
    }

    const markExternalResolved =
      phaseParsed.data === "after" && formData.get("mark_external_resolved") === "true";

    const reportUpdate: Record<string, unknown> = {
      assessment_status: "pending",
      updated_at: new Date().toISOString(),
    };
    if (markExternalResolved) {
      reportUpdate.external_status = "marked_resolved";
    }

    await supabase
      .from("reports")
      .update(reportUpdate)
      .eq("id", reportId)
      .eq("owner_id", user.id);

    await supabase.from("report_events").insert({
      report_id: reportId,
      owner_id: user.id,
      event_type: `${phaseParsed.data}_evidence_attached`,
      summary: `Attached sanitized ${phaseParsed.data.toUpperCase()} photo (EXIF stripped, SHA-256 ${sanitized.sha256Hash.slice(0, 10)}…, intake: ${intake.status.replaceAll("_", " ")}).`,
      metadata: {
        evidence_id: evidenceRow.id,
        mark_external_resolved: markExternalResolved,
        intake_status: intake.status,
        intake_engine: intake.engineUsed,
        pii_flagged_at_upload: intake.piiFlagged,
      },
    });

    return NextResponse.json(
      { evidence: evidenceRow, intakeWarnings: intake.warnings },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image validation failed." },
      { status: 400 }
    );
  }
}