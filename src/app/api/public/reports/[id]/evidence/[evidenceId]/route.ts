import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  const { id: reportId, evidenceId } = await context.params;

  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Public viewer unavailable." }, { status: 503 });
  }

  const { data: report } = await admin
    .from("reports")
    .select("id, is_public_shared, citizen_review")
    .eq("id", reportId)
    .single();

  if (!report || !report.is_public_shared || report.citizen_review === "not_reviewed") {
    return NextResponse.json({ error: "Not publicly available." }, { status: 404 });
  }

  const { data: allEvidence } = await admin
    .from("evidence")
    .select("id, storage_path, mime_type, has_pii_flag")
    .eq("report_id", reportId);

  // Strict privacy lock: if ANY photo in the report is flagged for PII, withhold raw photos publicly
  if (!allEvidence || allEvidence.some((e) => e.has_pii_flag)) {
    return NextResponse.json(
      { error: "Media withheld due to Stage-1 PII privacy protection." },
      { status: 403 }
    );
  }

  const target = allEvidence.find((e) => e.id === evidenceId);
  if (!target) {
    return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  }

  const { data: blob, error } = await admin.storage
    .from("civic-evidence")
    .download(target.storage_path);

  if (error || !blob) {
    return NextResponse.json({ error: "Could not load image." }, { status: 500 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": target.mime_type || "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}