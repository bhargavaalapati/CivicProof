"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceNav } from "@/components/ui/WorkspaceNav";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useToast } from "@/components/ui/ToastProvider";
import { Plus, BookOpen, MapPin, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface ReportItem {
  id: string;
  title: string;
  category: "pothole" | "garbage";
  landmark: string;
  external_status: string;
  citizen_review: string;
  assessment_status: string;
  is_synthetic_demo: boolean;
  created_at: string;
  evidence: { id: string; phase: string }[];
}

export default function ReportsListPage() {
  const router = useRouter();
  const toast = useToast();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [guideNotice, setGuideNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReportsData = useCallback(async (): Promise<ReportItem[] | null> => {
    const res = await fetch("/api/reports");
    if (res.status === 401) {
      router.push("/login");
      return null;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load reports");
    return (data.reports ?? []) as ReportItem[];
  }, [router]);

  useEffect(() => {
    let active = true;
    fetchReportsData()
      .then((items) => {
        if (active && items) setReports(items);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchReportsData]);

  async function handleSeedDemos() {
    setSeeding(true);
    setError(null);
    setGuideNotice(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      const items = await fetchReportsData();
      if (items) setReports(items);
      setGuideNotice(data.message || "3 synthetic Ward 18 evaluation cases loaded.");
      toast.success("Demos seeded", data.message || "3 synthetic Ward 18 evaluation cases loaded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load synthetic cases.");
      toast.error("Failed to seed demos", e instanceof Error ? e.message : "Could not load synthetic cases.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col">
      <WorkspaceNav />

      {/* Compact Guidebook & Optional Demo Strip directly below Nav */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setGuideOpen((prev) => !prev)}
              aria-expanded={guideOpen}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-blue-800 py-1.5"
            >
              <BookOpen className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
              <span>Quick Guide &amp; Evaluation Sandbox</span>
              {guideOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              GVMC Ward 18 – MVP Colony • Pothole &amp; Garbage Evidence
            </span>
          </div>

          {guideOpen && (
            <div className="mt-2 mb-2 rounded-xl bg-[#FAF9F6] border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 text-slate-700 max-w-xl">
                <p className="font-semibold text-slate-900">How to use CivicProof:</p>
                <p>
                  1) Create a report with a Before photo → 2) Attach the closure/After photo → 3) Run Provisional AI
                  Assessment → 4) Record your Citizen Decision &amp; export a PDF packet. Want to test without
                  uploading photos?
                </p>
              </div>
              <button
                type="button"
                onClick={handleSeedDemos}
                disabled={seeding}
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100 disabled:opacity-50 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {seeding ? "Loading Cases..." : "Load 3 Synthetic Demo Cases"}
              </button>
            </div>
          )}

          {guideNotice && (
            <div className="mb-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-900">
              {guideNotice}
            </div>
          )}
        </div>
      </div>

      <main id="main-content" className="max-w-4xl w-full mx-auto px-4 py-6 flex-1">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "My Reports" }]} backHref="/" />

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Your Civic Evidence Records</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track complaints independently. Municipal closure status never overrides your citizen confirmation.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center shadow-xs">
            <div className="text-4xl mb-3" role="img" aria-label="Clipboard">
              📋
            </div>
            <h2 className="text-lg font-bold text-slate-950 mb-1">No records yet</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              Ready when you are. Document a pothole or garbage complaint in GVMC Ward 18 with a before photo to
              start your verified evidence trail.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/reports/new"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" /> Create a Report
              </Link>
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4 text-blue-700" /> Open Guidebook
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => {
              const hasBefore = rep.evidence?.some((e) => e.phase === "before");
              const hasAfter = rep.evidence?.some((e) => e.phase === "after");
              return (
                <Link
                  key={rep.id}
                  href={`/reports/${rep.id}`}
                  className="block rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-400 hover:shadow-xs transition-all"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {rep.category}
                    </span>
                    {rep.is_synthetic_demo && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        SYNTHETIC DEMO
                      </span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">
                      {hasBefore ? "Before ✓" : "No Before"} • {hasAfter ? "After ✓" : "Awaiting After Photo"}
                    </span>
                  </div>
                  <h2 className="font-semibold text-base text-slate-900 mb-1">{rep.title}</h2>
                  {rep.landmark && (
                    <p className="text-xs text-slate-600 flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5" /> {rep.landmark}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      External: <strong>{rep.external_status.replaceAll("_", " ")}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                      Provisional AI: <strong>{rep.assessment_status}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      Citizen review: <strong>{rep.citizen_review.replaceAll("_", " ")}</strong>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}