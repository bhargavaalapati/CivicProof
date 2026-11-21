"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CitizenReview } from "@/lib/domain/contracts";
import {
  CheckCircle2,
  AlertOctagon,
  Camera,
  FileText,
  Globe,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface CitizenDecisionPanelProps {
  reportId: string;
  currentDecision: CitizenReview;
  latestNote: string;
  isPublicShared: boolean;
  publicSummary: string;
  hasPiiFlag: boolean;
}

export function CitizenDecisionPanel({
  reportId,
  currentDecision,
  latestNote,
  isPublicShared,
  publicSummary,
  hasPiiFlag,
}: CitizenDecisionPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Exclude<CitizenReview, "not_reviewed">>(
    currentDecision === "not_reviewed" ? "disputed" : currentDecision
  );
  const [factualNote, setFactualNote] = useState(latestNote);
  const [sharePublicly, setSharePublicly] = useState(isPublicShared);
  const [summaryText, setSummaryText] = useState(publicSummary);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSaveDecision(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);

    if (selected === "disputed" && factualNote.trim().length < 10) {
      setError("Disputing a closure requires a short factual explanation (at least 10 characters).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: selected,
          factual_note: factualNote,
          is_public_shared: sharePublicly,
          public_summary: summaryText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save review decision.");

      setSavedMsg("Your citizen review decision has been recorded on the audit timeline.");
      toast.success("Citizen review recorded", "Your decision has been added to the audit timeline.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision.");
      toast.error("Failed to save decision", err instanceof Error ? err.message : "Could not save review decision.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopyPublicLink() {
    const url = `${window.location.origin}/public/reports/${reportId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Your Citizen Review Decision</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Only you (the report owner) can confirm, dispute, or request clearer evidence. AI never decides for you.
          </p>
        </div>

        <Link
          href={`/reports/${reportId}/export`}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold hover:bg-slate-100"
        >
          <FileText className="w-4 h-4" /> Preview Evidence Packet (PDF)
        </Link>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-800">
          {error}
        </div>
      )}

      {savedMsg && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-sm text-blue-950">
          {savedMsg}
        </div>
      )}

      <form onSubmit={handleSaveDecision} className="space-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-slate-800 mb-2">
            Based on your own inspection of the Before &amp; After photos:
          </legend>
          <div className="grid sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelected("confirmed")}
              className={`min-h-[52px] p-3 rounded-xl border text-left transition-colors ${
                selected === "confirmed"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Confirm Fix
              </div>
              <p className={`text-xs mt-1 ${selected === "confirmed" ? "text-slate-200" : "text-slate-500"}`}>
                I inspected the evidence and confirm the issue looks fixed.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelected("disputed")}
              className={`min-h-[52px] p-3 rounded-xl border text-left transition-colors ${
                selected === "disputed"
                  ? "border-amber-700 bg-amber-700 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertOctagon className="w-4 h-4 shrink-0" /> Mark as Disputed
              </div>
              <p className={`text-xs mt-1 ${selected === "disputed" ? "text-amber-100" : "text-slate-500"}`}>
                Closure evidence does not match or the issue remains unfixed.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelected("more_evidence_needed")}
              className={`min-h-[52px] p-3 rounded-xl border text-left transition-colors ${
                selected === "more_evidence_needed"
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Camera className="w-4 h-4 shrink-0" /> Request Clearer Photo
              </div>
              <p className={`text-xs mt-1 ${selected === "more_evidence_needed" ? "text-blue-100" : "text-slate-500"}`}>
                Angle, lighting, or framing is insufficient to decide yet.
              </p>
            </button>
          </div>
        </fieldset>

        <div>
          <label htmlFor="factual_note" className="block text-sm font-medium text-slate-800 mb-1">
            Factual Note {selected === "disputed" ? "(Required — min. 10 characters)" : "(Optional)"}
          </label>
          <textarea
            id="factual_note"
            rows={3}
            required={selected === "disputed"}
            minLength={selected === "disputed" ? 10 : undefined}
            value={factualNote}
            onChange={(e) => setFactualNote(e.target.value)}
            placeholder="State factual visual discrepancies (e.g., 'Follow-up photo shows a park lane instead of the red brick compound wall in Sector 2.')"
            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Public-Safe Opt-In Controls */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sharePublicly}
              onChange={(e) => setSharePublicly(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-400"
            />
            <span className="text-sm text-slate-800">
              <strong className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-700" /> Enable Privacy-Safe Public Summary Link
              </strong>
              <span className="block text-xs text-slate-600 mt-0.5">
                Shares only your approved summary, approximate ward area (~110m), and categorical statuses. Zero contact details are exposed.
                {hasPiiFlag && " Because Stage-1 flagged possible PII, raw photos are automatically withheld from the public view."}
              </span>
            </span>
          </label>

          {sharePublicly && (
            <div>
              <label htmlFor="public_summary" className="block text-xs font-medium text-slate-700 mb-1">
                Citizen-Approved Public Summary (visible on public link)
              </label>
              <input
                id="public_summary"
                type="text"
                maxLength={400}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="e.g., Closure photo did not match the reported Ward 18 street corner; follow-up packet prepared."
                className="w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
          )}

          {isPublicShared && currentDecision !== "not_reviewed" && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <Link
                href={`/public/reports/${reportId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Public-Safe View
              </Link>
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied link" : "Copy Public Link"}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto min-h-[46px] px-6 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Recording Decision..." : "Save Citizen Review Decision"}
        </button>
      </form>
    </section>
  );
}