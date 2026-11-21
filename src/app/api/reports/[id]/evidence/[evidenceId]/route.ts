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