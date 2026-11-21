import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { applyCitizenDecision } from "@/lib/domain/workflow";
import { CitizenReviewSchema } from "@/lib/domain/contracts";

const ReviewRequestSchema = z.object({
  decision: CitizenReviewSchema.refine(
    (v) => v !== "not_reviewed",
    "Select confirmed, disputed, or more_evidence_needed."
  ),
  factual_note: z.string().trim().max(1000).optional().default(""),
  is_public_shared: z.boolean().optional(),
  public_summary: z.string().trim().max(400).optional(),
});

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

  const body = await request.json().catch(() => null);
  const parsed = ReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review payload." },
      { status: 400 }
    );
  }

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("owner_id", user.id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Report not found or access denied." }, { status: 404 });
  }

  // Enforce Phase 1 domain guardrails (owner check + min 10-char factual note for disputes)
  let nextState;
  try {
    nextState = applyCitizenDecision(
      {
        id: report.id,
        ownerId: report.owner_id,
        externalStatus: report.external_status,
        citizenReview: report.citizen_review,
        assessmentStatus: report.assessment_status,
        hasBeforeEvidence: true,
        hasAfterEvidence: true,
      },
      user.id,
      parsed.data.decision,
      parsed.data.factual_note
    );
  } catch (domainErr) {
    return NextResponse.json(
      { error: domainErr instanceof Error ? domainErr.message : "Invalid citizen review." },
      { status: 400 }
    );
  }

  const { data: reviewRow, error: revErr } = await supabase
    .from("reviews")
    .insert({
      report_id: reportId,
      owner_id: user.id,
      decision: nextState.citizenReview,
      factual_note: parsed.data.factual_note,
    })
    .select()
    .single();

  if (revErr) {
    return NextResponse.json({ error: "Could not save citizen review." }, { status: 500 });
  }

  const updatePayload: Record<string, unknown> = {
    citizen_review: nextState.citizenReview,
    updated_at: new Date().toISOString(),
  };

  if (typeof parsed.data.is_public_shared === "boolean") {
    updatePayload.is_public_shared = parsed.data.is_public_shared;
  }
  if (typeof parsed.data.public_summary === "string") {
    updatePayload.public_summary = parsed.data.public_summary;
  }

  const { error: updErr } = await supabase
    .from("reports")
    .update(updatePayload)
    .eq("id", reportId)
    .eq("owner_id", user.id);

  if (updErr) {
    return NextResponse.json({ error: "Could not update report status." }, { status: 500 });
  }

  await supabase.from("report_events").insert({
    report_id: reportId,
    owner_id: user.id,
    event_type: "citizen_review_recorded",
    summary: `Citizen recorded decision: ${nextState.citizenReview.replaceAll("_", " ")}.${
      parsed.data.factual_note ? ` Note: "${parsed.data.factual_note.slice(0, 120)}"` : ""
    }`,
    metadata: {
      decision: nextState.citizenReview,
      is_public_shared: updatePayload.is_public_shared ?? report.is_public_shared,
    },
  });

  return NextResponse.json({
    review: reviewRow,
    citizen_review: nextState.citizenReview,
  });
}