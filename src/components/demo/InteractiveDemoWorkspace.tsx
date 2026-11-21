// src/components/demo/InteractiveDemoWorkspace.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EvidenceAssessmentContract } from "@/lib/domain/contracts";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AlertOctagon,
  ArrowRight,
  Camera,
  CheckCircle2,
  FlaskConical,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface SyntheticDemoCase {
  id: string;
  shortLabel: string;
  tag: string;
  title: string;
  category: "pothole" | "garbage";
  landmark: string;
  coords: string;
  externalRef: string;
  description: string;
  beforeCaption: string;
  afterCaption: string;
  beforeSvg: string;
  afterSvg: string;
  stage1Summary: string;
  assessment: EvidenceAssessmentContract;
}

const DEMO_SCENARIOS: SyntheticDemoCase[] = [
  {
    id: "improved",
    shortLabel: "1. Apparent Improvement",
    tag: "SYNTHETIC DEMO 1 • POTHOLE",
    title: "Deep pothole near MVP Sector 4 Junction",
    category: "pothole",
    landmark: "MVP Sector 4 Main Rd, Blue Electric Pole #14",
    coords: "17.7421, 83.3362",
    externalRef: "DEMO-GVMC-2026-101",
    description:
      "Wide bitumen pothole right beside the blue electric pole and yellow curb marker on Sector 4 Main Road. Municipal portal marked resolved after patching.",
    beforeCaption: "Before: Crater beside Blue Pole #14 & yellow curb",
    afterCaption: "After: Same Blue Pole #14 with fresh asphalt patch",
    beforeSvg: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="145" fill="#dbeafe"/><rect y="145" width="640" height="255" fill="#475569"/><rect y="138" width="640" height="14" fill="#facc15"/><rect x="510" y="24" width="18" height="130" fill="#1d4ed8"/><ellipse cx="290" cy="275" rx="125" ry="48" fill="#1e293b" stroke="#0f172a" stroke-width="6"/><ellipse cx="290" cy="280" rx="88" ry="26" fill="#334155"/><text x="20" y="36" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a">SYNTHETIC BEFORE — Sector 4 Blue Pole #14</text></svg>`)}`,
    afterSvg: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="145" fill="#dbeafe"/><rect y="145" width="640" height="255" fill="#475569"/><rect y="138" width="640" height="14" fill="#facc15"/><rect x="510" y="24" width="18" height="130" fill="#1d4ed8"/><ellipse cx="290" cy="275" rx="128" ry="50" fill="#64748b" stroke="#94a3b8" stroke-width="3"/><text x="20" y="36" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a">SYNTHETIC AFTER — Same Blue Pole #14 (Patched)</text></svg>`)}`,
    stage1Summary: "Stage-1 Rubric: Level 2 (Likely Same Location) • PII Flag: Clear",
    assessment: {
      scene_comparability: "likely_same",
      visible_change: "improved",
      observations: [
        {
          image: "before",
          observation:
            "A wide dark pothole cavity sits in the foreground roadway aligned with the yellow curb and blue utility pole on the right.",
        },
        {
          image: "after",
          observation:
            "The same blue pole and yellow curb appear in matching positions, and the pothole cavity is filled with a lighter grey surface patch.",
        },
      ],
      limitations: [
        "Visual surface patching alone does not certify structural compaction or long-term durability.",
        "Citizen on-site inspection is still required before marking this complaint confirmed.",
      ],
      recommended_next_step: "confirm_with_user",
      requires_human_review: true,
    },
  },
  {
    id: "different",
    shortLabel: "2. Different Scene (Mismatch)",
    tag: "SYNTHETIC DEMO 2 • GARBAGE",
    title: "Overflowing garbage dump near Rythu Bazaar Corner",
    category: "garbage",
    landmark: "Red Brick Compound Wall, MVP Sector 2",
    coords: "17.7385, 83.3318",
    externalRef: "DEMO-GVMC-2026-204",
    description:
      "Large mound of mixed household waste next to the red brick compound wall. Closure photo appears to show a completely different tree-lined park lane.",
    beforeCaption: "Before: Waste mound beside red brick compound wall",
    afterCaption: "After: Clean walkway beside green park trees (mismatch)",
    beforeSvg: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="200" fill="#b91c1c"/><rect y="200" width="640" height="200" fill="#64748b"/><circle cx="250" cy="265" r="56" fill="#78350f"/><circle cx="320" cy="278" r="62" fill="#a16207"/><circle cx="372" cy="284" r="42" fill="#3f6212"/><rect x="225" y="280" width="52" height="30" fill="#f8fafc"/><text x="20" y="36" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff">SYNTHETIC BEFORE — Red Brick Wall (Waste Pile)</text></svg>`)}`,
    afterSvg: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="165" fill="#e0f2fe"/><rect y="165" width="640" height="90" fill="#15803d"/><rect y="255" width="640" height="145" fill="#cbd5e1"/><circle cx="150" cy="135" r="50" fill="#166534"/><circle cx="485" cy="130" r="56" fill="#166534"/><text x="20" y="36" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a">SYNTHETIC AFTER — Different Tree-Lined Park Lane</text></svg>`)}`,
    stage1Summary: "Stage-1 Rubric: Level 0 (Likely Different Location) • Zod Lock: Blocked 'improved'",
    assessment: {
      scene_comparability: "likely_different",
      visible_change: "insufficient_evidence",
      observations: [
        {
          image: "before",
          observation:
            "Accumulated waste bags and debris sit directly against a solid red brick compound wall.",
        },
        {
          image: "after",
          observation:
            "A clean paved walkway borders green foliage and trees with no red brick compound wall visible anywhere in the frame.",
        },
      ],
      limitations: [
        "Stage-1 comparison indicates the BEFORE and AFTER photos appear to show different physical locations.",
        "Because scene comparability is likely_different, CivicProof blocks any 'improved' conclusion in code.",
      ],
      recommended_next_step: "request_clearer_photo",
      requires_human_review: true,
    },
  },
  {
    id: "ambiguous",
    shortLabel: "3. Ambiguous Angle (Abstention)",
    tag: "SYNTHETIC DEMO 3 • POTHOLE",
    title: "Broken road edge pothole near MVP Double Road",
    category: "pothole",
    landmark: "MVP Double Road, Drainage Grate #7",
    coords: "17.7464, 83.3412",
    externalRef: "DEMO-GVMC-2026-309",
    description:
      "Damaged shoulder edge along the white drainage grate. Follow-up photo is a dark close-up of center asphalt with the damaged road edge outside the frame.",
    beforeCaption: "Before: Broken left road shoulder beside Drainage Grate #7",
    afterCaption: "After: Dark close-up of center lane (edge out of frame)",
    beforeSvg: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="125" fill="#e2e8f0"/><rect y="125" width="640" height="275" fill="#475569"/><rect x="28" y="135" width="120" height="30" fill="#cbd5e1" stroke="#334155" stroke-width="3"/><polygon points="28,172 168,172 140,268 28,255" fill="#0f172a"/><text x="20" y="36" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a">SYNTHETIC BEFORE — Left Road Edge + Grate #7</text></svg>`)}`,
    afterSvg: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#334155"/><line x1="0" y1="200" x2="640" y2="200" stroke="#f8fafc" stroke-width="7" stroke-dasharray="32 24"/><rect width="640" height="400" fill="rgba(15,23,42,0.35)"/><text x="20" y="36" font-family="sans-serif" font-size="16" font-weight="bold" fill="#f8fafc">SYNTHETIC AFTER — Dark Close-Up (Edge Out of Frame)</text></svg>`)}`,
    stage1Summary: "Stage-1 Rubric: Level 1 (Uncertain / Low Confidence) • Forced Abstention",
    assessment: {
      scene_comparability: "uncertain",
      visible_change: "insufficient_evidence",
      observations: [
        {
          image: "before",
          observation:
            "Road-edge damage is positioned directly beneath a rectangular drainage grate along the left shoulder.",
        },
        {
          image: "after",
          observation:
            "The follow-up image is a low-light close-up of a dashed road centerline; neither the drainage grate nor the left road edge is visible.",
        },
      ],
      limitations: [
        "Camera framing and lighting differ substantially between photographs.",
        "The original damaged road edge is outside the after photo frame, so repair cannot be established.",
      ],
      recommended_next_step: "request_clearer_photo",
      requires_human_review: true,
    },
  },
];

export function InteractiveDemoWorkspace() {
  const router = useRouter();
  const toast = useToast();
  const [activeId, setActiveId] = useState<string>("ambiguous");
  const [assessedIds, setAssessedIds] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [citizenDecisions, setCitizenDecisions] = useState<
    Record<string, { decision: string; note: string }>
  >({});
  const [noteInput, setNoteInput] = useState("");
  const [seedingReal, setSeedingReal] = useState(false);

  const activeCase = DEMO_SCENARIOS.find((c) => c.id === activeId) ?? DEMO_SCENARIOS[0];
  const isAssessed = Boolean(assessedIds[activeCase.id]);
  const savedDecision = citizenDecisions[activeCase.id];

  function handleRunSandboxAssessment() {
    setRunning(true);
    window.setTimeout(() => {
      setAssessedIds((prev) => ({ ...prev, [activeCase.id]: true }));
      setRunning(false);
      toast.info(
        "Provisional AI assessment loaded (Sandbox)",
        "Notice citizen review remains 'not reviewed' until you decide."
      );
    }, 550);
  }

  function handleRecordSandboxDecision(decision: "confirmed" | "disputed" | "more_evidence_needed") {
    if (decision === "disputed" && noteInput.trim().length < 10) {
      toast.error(
        "Factual note required",
        "Disputing a closure requires at least 10 characters explaining the visual mismatch."
      );
      return;
    }
    setCitizenDecisions((prev) => ({
      ...prev,
      [activeCase.id]: {
        decision,
        note:
          noteInput.trim() ||
          `Recorded ${decision.replaceAll("_", " ")} during interactive demo walkthrough.`,
      },
    }));
    setNoteInput("");
    toast.success("Citizen decision recorded (Sandbox)", `Marked as ${decision.replaceAll("_", " ")}.`);
  }

  async function handleSeedIntoLiveAccount() {
    setSeedingReal(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (res.status === 401) {
        toast.info("Sign in to run live Gemini API", "Redirecting to sign in so we can seed your private RLS workspace.");
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not seed cases.");
      toast.success("Loaded into your live workspace", data.message);
      router.push("/reports");
    } catch (err) {
      toast.error("Seed failed", err instanceof Error ? err.message : "Could not seed live workspace.");
    } finally {
      setSeedingReal(false);
    }
  }

  const out = activeCase.assessment;

  return (
    <div className="space-y-6">
      {/* Top Banner + 1-Click Live Workspace CTA */}
      <section className="rounded-2xl bg-slate-950 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <FlaskConical className="w-4 h-4" /> Judge Evaluation Sandbox • Synthetic Data
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl tracking-tight">
            One-Click Interactive Demo — No Upload Required
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Test all 3 GVMC Ward 18 evaluation scenarios immediately in incognito—including mismatched closure photos
            and controlled abstention—or load them into a live RLS account to trigger real Gemini Decisions + Gemini
            2.5 Flash calls.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeedIntoLiveAccount}
          disabled={seedingReal}
          className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 shrink-0"
        >
          {seedingReal ? "Loading Live Workspace..." : "Run With Live Gemini Account"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 1-Click Scenario Switcher */}
      <div role="tablist" aria-label="Synthetic demo cases" className="grid sm:grid-cols-3 gap-3">
        {DEMO_SCENARIOS.map((sc) => {
          const isActive = sc.id === activeCase.id;
          return (
            <button
              key={sc.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(sc.id)}
              className={`min-h-[54px] rounded-xl border p-3.5 text-left transition-all ${
                isActive
                  ? "border-blue-700 bg-blue-50/70 text-slate-950 shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wide text-amber-900">
                {sc.tag}
              </span>
              <span className="block text-sm font-bold mt-0.5">{sc.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Active Case Detail & Tri-State Separation */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
              {activeCase.category}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-100 text-amber-950">
              SYNTHETIC DEMONSTRATION RECORD
            </span>
            <span className="text-xs text-slate-500">Ref: {activeCase.externalRef}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-950">{activeCase.title}</h2>
          <p className="text-sm text-slate-700 mt-1">{activeCase.description}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
            <MapPin className="w-3.5 h-3.5" /> GVMC Ward 18 ({activeCase.coords}) • {activeCase.landmark}
          </p>
        </div>

        {/* Three Independent States */}
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <div className="text-slate-500 mb-0.5">1. External Portal Status</div>
            <div className="font-semibold text-slate-900">Marked resolved</div>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
            <div className="text-blue-800 mb-0.5">2. Provisional AI Assessment</div>
            <div className="font-semibold text-blue-950">{isAssessed ? "Complete" : "Pending"}</div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <div className="text-amber-900 mb-0.5">3. Citizen Review Decision</div>
            <div className="font-semibold text-amber-950 capitalize">
              {savedDecision ? savedDecision.decision.replaceAll("_", " ") : "Not reviewed"}
            </div>
          </div>
        </div>

        {/* Before & After Evidence Pair */}
        <div className="grid md:grid-cols-2 gap-4">
          <figure className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeCase.beforeSvg}
              alt={activeCase.beforeCaption}
              className="w-full h-52 object-cover rounded-lg border border-slate-200"
            />
            <figcaption className="text-xs font-medium text-slate-700 mt-2">
              {activeCase.beforeCaption}
            </figcaption>
          </figure>
          <figure className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeCase.afterSvg}
              alt={activeCase.afterCaption}
              className="w-full h-52 object-cover rounded-lg border border-slate-200"
            />
            <figcaption className="text-xs font-medium text-slate-700 mt-2">
              {activeCase.afterCaption}
            </figcaption>
          </figure>
        </div>

        {/* Provisional AI Assessment Sandbox Trigger */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" /> Provisional AI Assessment (Sandbox Replay)
              </h3>
              <p className="text-xs text-slate-600">
                Uses exact CivicProof Zod contract outputs. Zero green &ldquo;Verified&rdquo; badges or invented %.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunSandboxAssessment}
              disabled={running}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {running ? "Running Two-Stage Evaluation..." : isAssessed ? "Re-run Sandbox Evaluation" : "Run Provisional AI Assessment"}
            </button>
          </div>

          {isAssessed && (
            <div className="space-y-3">
              <p className="text-xs font-mono text-slate-600">{activeCase.stage1Summary}</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div
                  className={`rounded-xl p-4 border ${
                    out.scene_comparability === "likely_same"
                      ? "bg-blue-50 border-blue-200 text-blue-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="text-xs uppercase font-semibold opacity-75 mb-1">
                    Scene Comparability (Provisional)
                  </div>
                  <div className="font-bold capitalize">{out.scene_comparability.replaceAll("_", " ")}</div>
                </div>
                <div
                  className={`rounded-xl p-4 border ${
                    out.visible_change === "improved"
                      ? "bg-slate-100 border-slate-300 text-slate-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="text-xs uppercase font-semibold opacity-75 mb-1">
                    Apparent Visible Change (Provisional)
                  </div>
                  <div className="font-bold capitalize">{out.visible_change.replaceAll("_", " ")}</div>
                </div>
              </div>

              {(out.scene_comparability !== "likely_same" ||
                out.visible_change === "insufficient_evidence") && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3 text-sm text-amber-950">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Evidence Uncertainty:</strong> Supplied photos do not reliably prove resolution.
                    Recommended next step: request a clearer matched-angle photo.
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-900 mb-2">What the system noticed</h4>
                  <ul className="space-y-1.5 text-slate-700">
                    {out.observations.map((o, idx) => (
                      <li key={idx}>
                        <span className="font-mono text-[11px] font-bold uppercase bg-slate-200 px-1.5 py-0.5 rounded mr-1.5">
                          {o.image}
                        </span>
                        {o.observation}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-4">
                  <h4 className="font-semibold text-amber-950 mb-2">Limitations (What this does NOT establish)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-amber-950">
                    {out.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Citizen Control Test */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-base font-bold text-slate-950">Try the Citizen Decision Gate</h3>
          <label htmlFor="sandbox-note" className="block text-xs font-medium text-slate-700">
            Factual note (required min. 10 chars when disputing)
          </label>
          <input
            id="sandbox-note"
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="e.g., Closure photo shows a park lane instead of the red brick wall in Sector 2."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 text-sm"
          />
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleRecordSandboxDecision("confirmed")}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Fix
            </button>
            <button
              type="button"
              onClick={() => handleRecordSandboxDecision("disputed")}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-amber-700 text-white text-xs sm:text-sm font-semibold hover:bg-amber-800"
            >
              <AlertOctagon className="w-4 h-4" /> Mark as Disputed
            </button>
            <button
              type="button"
              onClick={() => handleRecordSandboxDecision("more_evidence_needed")}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-blue-700 text-white text-xs sm:text-sm font-semibold hover:bg-blue-800"
            >
              <Camera className="w-4 h-4" /> Request Clearer Photo
            </button>
          </div>
          {savedDecision && (
            <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <strong>Recorded in sandbox:</strong>{" "}
              <span className="uppercase font-semibold">{savedDecision.decision.replaceAll("_", " ")}</span> —{" "}
              {savedDecision.note}
            </p>
          )}
        </div>
      </section>

      <div className="text-center text-xs text-slate-600">
        Want to upload your own photos, test EXIF stripping, export printable PDF packets, and verify RLS privacy?{" "}
        <Link href="/signup" className="font-semibold text-blue-800 underline">
          Create a free account
        </Link>{" "}
        or{" "}
        <Link href="/reports" className="font-semibold text-blue-800 underline">
          open your workspace
        </Link>
        .
      </div>
    </div>
  );
}