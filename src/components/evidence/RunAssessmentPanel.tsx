"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EvidenceAssessmentContract } from "@/lib/domain/contracts";
import { AlertTriangle, RefreshCw, ShieldAlert, Sparkles, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface StoredAssessment {
  id: string;
  stage1_model_id: string;
  stage2_model_id: string;
  prompt_version: string;
  structured_output: EvidenceAssessmentContract | null;
  status: "pending" | "complete" | "failed";
  error_code: string | null;
  created_at: string;
}

const COMPARABILITY_LABELS: Record<EvidenceAssessmentContract["scene_comparability"], string> = {
  likely_same: "Likely same location",
  uncertain: "Uncertain — needs clearer evidence",
  likely_different: "Likely different location",
};

const CHANGE_LABELS: Record<EvidenceAssessmentContract["visible_change"], string> = {
  improved: "Apparent visual improvement (provisional)",
  unchanged: "Issue appears unchanged",
  worsened: "Issue appears worsened",
  insufficient_evidence: "Insufficient evidence to judge change",
};

const NEXT_STEP_LABELS: Record<EvidenceAssessmentContract["recommended_next_step"], string> = {
  confirm_with_user: "Inspect both photos and record your own decision",
  request_clearer_photo: "Request or upload a clearer, matched-angle follow-up photo",
  human_review: "Requires manual citizen inspection before closing",
};

export function RunAssessmentPanel({
  reportId,
  hasBefore,
  hasAfter,
  hasPiiFlag,
  latestAssessment,
}: {
  reportId: string;
  hasBefore: boolean;
  hasAfter: boolean;
  hasPiiFlag: boolean;
  latestAssessment: StoredAssessment | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRun = hasBefore && hasAfter;
  const output = latestAssessment?.structured_output ?? null;

  async function handleRunAssessment() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/assessments`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Assessment failed.");
        toast.error("Failed to run assessment", data.error || "Assessment failed.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete assessment.");
      toast.error("Failed to run assessment", err instanceof Error ? err.message : "Could not complete assessment.");
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-700" />
            Provisional AI Evidence Assessment
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Two-stage server-side analysis (Gemini Decisions triage + Gemini 2.5 Flash observations). AI never confirms or closes your report.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAssessment}
          disabled={!canRun || running}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
          {running
            ? "Analyzing Photos..."
            : latestAssessment
            ? "Re-run Assessment"
            : "Run Provisional AI Assessment"}
        </button>
      </div>

      {!canRun && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
          Attach both a <strong>Before</strong> photo and an <strong>After</strong> photo above to enable evidence comparison.
        </div>
      )}

      {canRun && !latestAssessment && !running && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-950">
          <strong>Provider Notice:</strong> Clicking &ldquo;Run Provisional AI Assessment&rdquo; sends your EXIF-stripped Before and After photos to Google Gemini on our server. No personal contact details are sent.
        </div>
      )}

      {hasPiiFlag && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3 text-sm text-amber-950">
          <EyeOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Privacy Flag Active (Stage-1 PII Check):</strong> A recognizable face or vehicle plate may be visible in this evidence set. Raw photos are automatically kept out of any public report view.
          </div>
        </div>
      )}

      {(error || latestAssessment?.status === "failed") && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-900 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <strong>Assessment failed ({latestAssessment?.error_code ?? "RECOVERABLE_ERROR"}):</strong>{" "}
              {error ?? "The AI provider could not complete this comparison. Your photos remain safely saved — you can retry or decide manually."}
            </div>
          </div>
        </div>
      )}

      {output && latestAssessment?.status === "complete" && (
        <div className="space-y-4 pt-2 border-t border-slate-100">
          {/* Categorical Assessment Summary — Neutral / Blue / Amber only, NO green "Verified" */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div
              className={`rounded-xl p-4 border ${
                output.scene_comparability === "likely_same"
                  ? "bg-blue-50 border-blue-200 text-blue-950"
                  : "bg-amber-50 border-amber-300 text-amber-950"
              }`}
            >
              <div className="text-xs uppercase tracking-wide font-semibold opacity-75 mb-1">
                Scene Comparability (Provisional)
              </div>
              <div className="text-base font-bold">
                {COMPARABILITY_LABELS[output.scene_comparability]}
              </div>
            </div>

            <div
              className={`rounded-xl p-4 border ${
                output.visible_change === "improved"
                  ? "bg-slate-100 border-slate-300 text-slate-900"
                  : "bg-amber-50 border-amber-300 text-amber-950"
              }`}
            >
              <div className="text-xs uppercase tracking-wide font-semibold opacity-75 mb-1">
                Apparent Visible Change (Provisional)
              </div>
              <div className="text-base font-bold">
                {CHANGE_LABELS[output.visible_change]}
              </div>
            </div>
          </div>

          {/* Uncertainty Banner placed directly beside the conclusion */}
          {(output.scene_comparability !== "likely_same" ||
            output.visible_change === "insufficient_evidence") && (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3 text-sm text-amber-950">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Evidence Uncertainty:</strong> The supplied photographs do not reliably establish that the original issue was fixed.{" "}
                <span>{NEXT_STEP_LABELS[output.recommended_next_step]}.</span>
              </div>
            </div>
          )}

          {/* Observations */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">What the system noticed</h3>
            <ul className="space-y-2 text-sm text-slate-800">
              {output.observations.map((obs, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 mt-0.5 shrink-0">
                    {obs.image}
                  </span>
                  <span>{obs.observation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations */}
          {output.limitations.length > 0 && (
            <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-4">
              <h3 className="text-sm font-semibold text-amber-950 mb-2">
                What this evidence does NOT establish (Limitations)
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-amber-950">
                {output.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-slate-500 font-mono">
            Provenance: {latestAssessment.stage1_model_id} + {latestAssessment.stage2_model_id} • Prompt{" "}
            {latestAssessment.prompt_version} • Human review required: Yes
          </p>
        </div>
      )}
    </section>
  );
}