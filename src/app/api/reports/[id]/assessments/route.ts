import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkUserRateLimit } from "@/lib/security/rate-limit";
import { runTwoStageAssessment } from "@/lib/ai/assessment-engine";
import { PROMPT_VERSION, STAGE1_MODEL_ID, STAGE2_MODEL_ID } from "@/lib/ai/prompts";

function sanitizeErrorCode(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("MISSING_GEMINI_API_KEY")) return "AI_PROVIDER_NOT_CONFIGURED";
  if (msg.includes("DECISIONS_API_UNAVAILABLE")) return "DECISIONS_SDK_VERSION_REQUIRED";
  if (msg.includes("TIMEOUT") || msg.includes("AbortError") || msg.includes("timed out")) {
    return "PROVIDER_TIMEOUT";
  }
  if (msg.includes("429") || msg.toLowerCase().includes("quota")) return "PROVIDER_RATE_LIMITED";
  return "ASSESSMENT_PROVIDER_ERROR";
}

export async function POST(
  _request: Request,
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

  // 1. Per-user rate limit
  const rate = checkUserRateLimit(user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Assessment rate limit reached. Please retry in ${rate.retryAfterSeconds} seconds.`,
        error_code: "USER_RATE_LIMITED",
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  // 2. Verify explicit report ownership
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("owner_id", user.id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Report not found or access denied." }, { status: 404 });
  }

  // 3. Load latest BEFORE and AFTER evidence rows
  const { data: evidenceRows } = await supabase
    .from("evidence")
    .select("*")
    .eq("report_id", reportId)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const beforeEv = evidenceRows?.find((e) => e.phase === "before");
  const afterEv = evidenceRows?.find((e) => e.phase === "after");

  if (!beforeEv || !afterEv) {
    return NextResponse.json(
      { error: "Both a Before photo and an After photo are required before running an assessment." },
      { status: 400 }
    );
  }

  // 4. Download sanitized private derivatives server-side
  const [beforeDl, afterDl] = await Promise.all([
    supabase.storage.from("civic-evidence").download(beforeEv.storage_path),
    supabase.storage.from("civic-evidence").download(afterEv.storage_path),
  ]);

  if (beforeDl.error || !beforeDl.data || afterDl.error || !afterDl.data) {
    return NextResponse.json(
      { error: "Could not load private evidence files from storage." },
      { status: 500 }
    );
  }

  const beforeBuffer = Buffer.from(await beforeDl.data.arrayBuffer());
  const afterBuffer = Buffer.from(await afterDl.data.arrayBuffer());

  try {
    const result = await runTwoStageAssessment({
      beforeBuffer,
      afterBuffer,
      beforeMimeType: beforeEv.mime_type || "image/jpeg",
      afterMimeType: afterEv.mime_type || "image/jpeg",
      category: report.category,
      landmark: report.landmark ?? "",
    });

    // 5. Persist Stage-1 PII flag on evidence records so flagged images stay excluded from public views
    if (result.stage1Policy.piiFlagged) {
      await supabase
        .from("evidence")
        .update({ has_pii_flag: true })
        .in("id", [beforeEv.id, afterEv.id])
        .eq("owner_id", user.id);
    }

    // 6. Save assessment provenance (NOTE: citizen_review is NEVER touched!)
    const { data: assessmentRow, error: insertErr } = await supabase
      .from("assessments")
      .insert({
        report_id: reportId,
        owner_id: user.id,
        before_evidence_id: beforeEv.id,
        after_evidence_id: afterEv.id,
        stage1_model_id: result.metadata.stage1ModelId,
        stage2_model_id: result.metadata.stage2ModelId,
        prompt_version: result.metadata.promptVersion,
        stage1_raw_json: result.stage1Policy.rawAnswers,
        structured_output: result.assessment,
        status: "complete",
      })
      .select()
      .single();

    if (insertErr) {
      throw new Error("DB_SAVE_FAILED");
    }

    await supabase
      .from("reports")
      .update({
        assessment_status: "complete",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("owner_id", user.id);

    await supabase.from("report_events").insert({
      report_id: reportId,
      owner_id: user.id,
      event_type: "ai_assessment_completed",
      summary: `Provisional AI assessment completed (${result.assessment.scene_comparability.replaceAll("_", " ")} / ${result.assessment.visible_change.replaceAll("_", " ")}). Citizen review still required.`,
      metadata: {
        stage1_model: result.metadata.stage1ModelId,
        stage2_model: result.metadata.stage2ModelId,
        prompt_version: result.metadata.promptVersion,
        duration_ms: result.metadata.durationMs,
        pii_flagged: result.stage1Policy.piiFlagged,
      },
    });

    return NextResponse.json({
      assessment: assessmentRow,
      piiFlagged: result.stage1Policy.piiFlagged,
      remainingQuota: rate.remaining,
    });
  } catch (err) {
    const errorCode = sanitizeErrorCode(err);

    // Record failure cleanly while preserving all user evidence for retry
    await supabase.from("assessments").insert({
      report_id: reportId,
      owner_id: user.id,
      before_evidence_id: beforeEv.id,
      after_evidence_id: afterEv.id,
      stage1_model_id: STAGE1_MODEL_ID,
      stage2_model_id: STAGE2_MODEL_ID,
      prompt_version: PROMPT_VERSION,
      status: "failed",
      error_code: errorCode,
    });

    await supabase
      .from("reports")
      .update({
        assessment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("owner_id", user.id);

    await supabase.from("report_events").insert({
      report_id: reportId,
      owner_id: user.id,
      event_type: "ai_assessment_failed",
      summary: `Provisional AI assessment could not complete (${errorCode}). Your evidence is preserved and you may retry.`,
      metadata: { error_code: errorCode },
    });

    return NextResponse.json(
      {
        error:
          errorCode === "PROVIDER_TIMEOUT"
            ? "The AI vision provider timed out. Your photos are safely stored — click Retry Assessment."
            : errorCode === "AI_PROVIDER_NOT_CONFIGURED"
            ? "Server Gemini API key is missing in .env.local (GOOGLE_GENERATIVE_AI_API_KEY)."
            : "The AI assessment could not complete right now. Your evidence is preserved — please retry.",
        error_code: errorCode,
      },
      { status: 502 }
    );
  }
}