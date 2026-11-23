import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  const { id: reportId, evidenceId } = await context.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: ev } = await supabase
    .from("evidence")
    .select("storage_path, mime_type")
    .eq("id", evidenceId)
    .eq("report_id", reportId)
    .eq("owner_id", user.id)
    .single();

  if (!ev) {
    return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  }

  const { data: blob, error } = await supabase.storage
    .from("civic-evidence")
    .download(ev.storage_path);

  if (error || !blob) {
    return NextResponse.json({ error: "Could not retrieve image." }, { status: 500 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": ev.mime_type || "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  const { id: reportId, evidenceId } = await context.params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: ev } = await supabase
    .from("evidence")
    .select("id, phase, storage_path")
    .eq("id", evidenceId)
    .eq("report_id", reportId)
    .eq("owner_id", user.id)
    .single();

  if (!ev) {
    return NextResponse.json({ error: "Evidence not found or access denied." }, { status: 404 });
  }

  await supabase.storage.from("civic-evidence").remove([ev.storage_path]);

  const { error: delErr } = await supabase
    .from("evidence")
    .delete()
    .eq("id", evidenceId)
    .eq("owner_id", user.id);

  if (delErr) {
    return NextResponse.json({ error: "Failed to remove evidence record." }, { status: 500 });
  }

  // Reset assessment_status to pending (never touching citizen_review)
  await supabase
    .from("reports")
    .update({ assessment_status: "pending", updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("owner_id", user.id);

  await supabase.from("report_events").insert({
    report_id: reportId,
    owner_id: user.id,
    event_type: "evidence_removed",
    summary: `Owner removed ${ev.phase.toUpperCase()} photo to upload a replacement.`,
    metadata: { removed_evidence_id: evidenceId, phase: ev.phase },
  });

  return NextResponse.json({ deleted: true });
}