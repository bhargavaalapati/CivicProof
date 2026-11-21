"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CONFIGURED_LOCALITY } from "@/lib/domain/contracts";
import { MapPin, WifiOff, UploadCloud } from "lucide-react";
import {WorkspaceNav} from "@/components/ui/WorkspaceNav";
import {Breadcrumbs} from "@/components/ui/Breadcrumbs";

const DRAFT_STORAGE_KEY = "civicproof_new_report_draft_v1";

interface DraftState {
  category: "pothole" | "garbage";
  title: string;
  description: string;
  lat: number;
  lng: number;
  landmark: string;
  external_ref_id: string;
  external_status: "unknown" | "submitted_by_user" | "acknowledged" | "marked_resolved";
}

const DEFAULT_DRAFT: DraftState = {
  category: "pothole",
  title: "",
  description: "",
  lat: 17.742,
  lng: 83.3365,
  landmark: "",
  external_ref_id: "",
  external_status: "submitted_by_user",
};

export default function NewReportPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(DEFAULT_DRAFT);
  const [restoredNotice, setRestoredNotice] = useState(false);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

// Restore saved offline draft asynchronously after mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<DraftState>;
          if (parsed.title || parsed.description || parsed.landmark) {
            setDraft({ ...DEFAULT_DRAFT, ...parsed });
            setRestoredNotice(true);
          }
        }
      } catch {
        // Ignore corrupted localStorage
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Continuously persist draft text + coordinates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage quota errors
    }
  }, [draft]);

  const { minLat, maxLat, minLng, maxLng } = CONFIGURED_LOCALITY.bounds;

  function handleWardPinClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const yRatio = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const newLng = Number((minLng + xRatio * (maxLng - minLng)).toFixed(5));
    const newLat = Number((maxLat - yRatio * (maxLat - minLat)).toFixed(5));
    setDraft((prev) => ({ ...prev, lat: newLat, lng: newLng }));
  }

  const pinLeftPct = Math.min(100, Math.max(0, ((draft.lng - minLng) / (maxLng - minLng)) * 100));
  const pinTopPct = Math.min(100, Math.max(0, ((maxLat - draft.lat) / (maxLat - minLat)) * 100));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!beforeFile) {
      setError("Please attach an initial Before photo (JPEG, PNG, or WebP, max 5 MB).");
      return;
    }
    if (!aiConsent) {
      setError("Please confirm the AI image processing notice before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("category", draft.category);
      fd.append("title", draft.title);
      fd.append("description", draft.description);
      fd.append("lat", String(draft.lat));
      fd.append("lng", String(draft.lng));
      fd.append("landmark", draft.landmark);
      fd.append("external_ref_id", draft.external_ref_id);
      fd.append("external_status", draft.external_status);
      fd.append("ai_consent_acknowledged", String(aiConsent));
      fd.append("before_photo", beforeFile);

      const res = await fetch("/api/reports", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not create report.");
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      router.push(`/reports/${data.report.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} (Your draft text and location remain saved locally.)`
          : "Network error — your draft text and location remain saved locally."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <WorkspaceNav />
      <main className="min-h-screen bg-[#FAF9F6] text-slate-900 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "My Reports", href: "/reports" },
              { label: "New Report" },
            ]}
            backHref="/reports"
          />
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-1">Start a Civic Evidence Record</h1>
          <p className="text-sm text-slate-600 mb-5">
            Supported locality: <strong>{CONFIGURED_LOCALITY.name}</strong>. Categories: pothole or garbage only.
          </p>

          {restoredNotice && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>Restored your unsent draft text and map pin from offline local storage.</span>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset>
              <legend className="text-sm font-medium text-slate-800 mb-2">Issue Category</legend>
              <div className="grid grid-cols-2 gap-3">
                {(["pothole", "garbage"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, category: cat }))}
                    className={`min-h-[44px] rounded-lg border text-sm font-semibold capitalize ${
                      draft.category === cat
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-800 mb-1">
                Short Issue Title
              </label>
              <input
                id="title"
                required
                minLength={5}
                maxLength={140}
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Deep pothole beside Sector 4 transformer pole"
                className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-800 mb-1">
                Factual Description (visible landmarks help later comparison)
              </label>
              <textarea
                id="description"
                required
                minLength={10}
                maxLength={1000}
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe visible damage and nearby fixed landmarks (poles, wall color, drainage grate)..."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Manual Ward 18 Pin Picker */}
            <div>
              <span className="block text-sm font-medium text-slate-800 mb-1">
                Confirm Location Inside GVMC Ward 18 (Click grid or enter coordinates)
              </span>
              <div
                onClick={handleWardPinClick}
                role="application"
                aria-label="Ward 18 coordinate selector"
                className="relative h-44 rounded-xl border border-slate-300 bg-slate-100 cursor-crosshair overflow-hidden mb-2"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              >
                <span className="absolute top-2 left-2 text-[11px] bg-white/90 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                  GVMC Ward 18 – MVP Colony Bounds
                </span>
                <div
                  className="absolute -translate-x-1/2 -translate-y-full text-blue-700 pointer-events-none"
                  style={{ left: `${pinLeftPct}%`, top: `${pinTopPct}%` }}
                >
                  <MapPin className="w-7 h-7 fill-blue-600 text-white drop-shadow" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lat" className="block text-xs text-slate-600 mb-1">
                    Latitude ({minLat}–{maxLat})
                  </label>
                  <input
                    id="lat"
                    type="number"
                    step="0.00001"
                    min={minLat}
                    max={maxLat}
                    required
                    value={draft.lat}
                    onChange={(e) => setDraft((p) => ({ ...p, lat: Number(e.target.value) }))}
                    className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="lng" className="block text-xs text-slate-600 mb-1">
                    Longitude ({minLng}–{maxLng})
                  </label>
                  <input
                    id="lng"
                    type="number"
                    step="0.00001"
                    min={minLng}
                    max={maxLng}
                    required
                    value={draft.lng}
                    onChange={(e) => setDraft((p) => ({ ...p, lng: Number(e.target.value) }))}
                    className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="landmark" className="block text-sm font-medium text-slate-800 mb-1">
                  Nearby Landmark (optional)
                </label>
                <input
                  id="landmark"
                  value={draft.landmark}
                  onChange={(e) => setDraft((p) => ({ ...p, landmark: e.target.value }))}
                  placeholder="e.g., Sector 4 Rythu Bazaar corner"
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="external_ref_id" className="block text-sm font-medium text-slate-800 mb-1">
                  External Complaint ID (optional)
                </label>
                <input
                  id="external_ref_id"
                  value={draft.external_ref_id}
                  onChange={(e) => setDraft((p) => ({ ...p, external_ref_id: e.target.value }))}
                  placeholder="e.g., GVMC-2026-4412"
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="before_photo" className="block text-sm font-medium text-slate-800 mb-1">
                Initial &ldquo;Before&rdquo; Photo (JPEG/PNG/WebP, max 5 MB)
              </label>
              <label
                htmlFor="before_photo"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 cursor-pointer hover:bg-slate-100"
              >
                <UploadCloud className="w-6 h-6 text-slate-500 mb-1" />
                <span className="text-sm font-medium text-slate-700">
                  {beforeFile ? beforeFile.name : "Choose Before Photo"}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  File signature verified • EXIF &amp; GPS stripped automatically
                </span>
                <input
                  id="before_photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-950">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiConsent}
                  onChange={(e) => setAiConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-blue-400"
                />
                <span>
                  <strong>AI Provider &amp; Privacy Notice:</strong> When you later run an evidence comparison, your
                  sanitized Before and After photos will be sent to Google Gemini for provisional visual assessment.
                  Avoid capturing people&apos;s faces or vehicle plates. Do not enter Aadhaar or phone numbers.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Validating & Sanitizing Photo..." : "Save Report & Before Evidence"}
            </button>
          </form>
        </div>
      </div>
    </main>
    </>
  );
}