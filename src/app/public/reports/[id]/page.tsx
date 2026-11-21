// src/app/public/reports/[id]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildPublicSafeReportView } from "@/lib/domain/public-safe";
import { EyeOff, MapPin, ShieldCheck, AlertTriangle } from "lucide-react";

async function PublicSafeReportContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  let admin;
  try {
    admin = createAdminSupabase();
  } catch {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl bg-amber-50 border border-amber-300 p-6 text-sm text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Server Setup Needed:</strong> Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
          <code className="font-mono">.env.local</code> and restart <code className="font-mono">npm run dev</code> to
          enable read-only public-safe report links.
        </div>
      </div>
    );
  }

  const [{ data: report }, { data: evidence }, { data: assessments }] = await Promise.all([
    admin.from("reports").select("*").eq("id", id).single(),
    admin
      .from("evidence")
      .select("id, phase, has_pii_flag, sha256_hash, created_at")
      .eq("report_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("assessments")
      .select("prompt_version, structured_output")
      .eq("report_id", id)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!report) notFound();

  const publicView = buildPublicSafeReportView({
    report,
    evidence: evidence ?? [],
    latestAssessment: assessments?.[0] ?? null,
  });

  if (!publicView) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5 font-semibold text-blue-800">
          <ShieldCheck className="w-4 h-4" /> CivicProof • Privacy-Safe Public View
        </span>
        <Link href="/" className="underline hover:text-slate-900">
          About CivicProof
        </Link>
      </div>

      <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
            {publicView.category}
          </span>
          {publicView.isSyntheticDemo && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-100 text-amber-900">
              SYNTHETIC DEMONSTRATION RECORD
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold">{publicView.title}</h1>

        <p className="text-xs text-slate-600 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {publicView.approximateLocation.locality} (Approx. {publicView.approximateLocation.approxLat},{" "}
          {publicView.approximateLocation.approxLng})
        </p>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="text-xs text-slate-500 mb-1">External Municipal Status</div>
            <div className="font-semibold capitalize">{publicView.externalStatus.replaceAll("_", " ")}</div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="text-xs text-amber-800 mb-1">Citizen Review Decision</div>
            <div className="font-semibold text-amber-950 capitalize">
              {publicView.citizenReview.replaceAll("_", " ")}
            </div>
          </div>
        </div>

        <section className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <h2 className="text-sm font-semibold mb-1">Citizen-Approved Public Summary</h2>
          <p className="text-sm text-slate-800">{publicView.citizenApprovedSummary}</p>
        </section>

        {publicView.provisionalAssessment && (
          <section className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-950">
            <h2 className="font-semibold mb-1">Provisional AI Assessment Status</h2>
            <p>
              Comparability:{" "}
              <strong>{publicView.provisionalAssessment.sceneComparability.replaceAll("_", " ")}</strong> • Visible
              change: <strong>{publicView.provisionalAssessment.visibleChange.replaceAll("_", " ")}</strong> •{" "}
              {publicView.provisionalAssessment.limitationsCount} limitation(s) noted.
            </p>
            <p className="text-xs text-blue-800 mt-1 font-mono">
              Prompt {publicView.provisionalAssessment.promptVersion} • Non-authoritative
            </p>
          </section>
        )}

        {/* Privacy-Safe Media Section */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Evidence Media</h2>
          {publicView.mediaStatus.piiWithheld ? (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3 text-sm text-amber-950">
              <EyeOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Photographs Withheld for Privacy:</strong> Stage-1 automated screening flagged possible faces or
                vehicle registration plates in this evidence set. Raw media is excluded from public views.
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {publicView.mediaStatus.beforeEvidenceId && (
                <div className="border border-slate-200 rounded-xl p-3">
                  <p className="text-xs font-semibold mb-2">Before Photo (EXIF Stripped)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/public/reports/${publicView.id}/evidence/${publicView.mediaStatus.beforeEvidenceId}`}
                    alt="Public-safe before photograph"
                    className="w-full h-52 object-cover rounded-lg"
                  />
                </div>
              )}
              {publicView.mediaStatus.afterEvidenceId && (
                <div className="border border-slate-200 rounded-xl p-3">
                  <p className="text-xs font-semibold mb-2">After Photo (EXIF Stripped)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/public/reports/${publicView.id}/evidence/${publicView.mediaStatus.afterEvidenceId}`}
                    alt="Public-safe after photograph"
                    className="w-full h-52 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-100 pt-4 text-xs text-slate-500">
          No reporter contact details, government IDs, phone numbers, or exact residential coordinates are displayed on
          this public page. CivicProof is an independent citizen workspace.
        </footer>
      </article>
    </div>
  );
}

export default function PublicSafeReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-slate-900 py-8 px-4">
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto h-80 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        }
      >
        <PublicSafeReportContent params={params} />
      </Suspense>
    </main>
  );
}