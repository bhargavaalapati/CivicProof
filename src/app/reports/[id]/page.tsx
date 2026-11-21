// src/app/reports/[id]/page.tsx
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { AddAfterPhotoForm } from "@/components/evidence/AddAfterPhotoForm";
import { RunAssessmentPanel } from "@/components/evidence/RunAssessmentPanel";
import { CitizenDecisionPanel } from "@/components/reports/CitizenDecisionPanel";
import {WorkspaceNav} from "@/components/ui/WorkspaceNav";
import {Breadcrumbs} from "@/components/ui/Breadcrumbs";
import { MapPin, Clock } from "lucide-react";

function ReportDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-6 w-36 bg-slate-200 rounded" />
      <div className="h-44 bg-white border border-slate-200 rounded-2xl" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-72 bg-white border border-slate-200 rounded-2xl" />
        <div className="h-72 bg-white border border-slate-200 rounded-2xl" />
      </div>
      <div className="h-48 bg-white border border-slate-200 rounded-2xl" />
    </div>
  );
}

async function ReportDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!report) notFound();

  const [{ data: evidenceList }, { data: assessments }, { data: reviews }, { data: events }] =
    await Promise.all([
      supabase
        .from("evidence")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("assessments")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("reviews")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("report_events")
        .select("*")
        .eq("report_id", id)
        .order("created_at", { ascending: true }),
    ]);

  const beforeEv = evidenceList?.find((e) => e.phase === "before");
  const afterEv = evidenceList?.find((e) => e.phase === "after");
  const hasPiiFlag = Boolean(beforeEv?.has_pii_flag || afterEv?.has_pii_flag);
  const latestAssessment = assessments?.[0] ?? null;
  const latestReview = reviews?.[0] ?? null;

  return (
    <>
    <WorkspaceNav />
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Reports", href: "/reports" },
          { label: report.title.slice(0, 36) + (report.title.length > 36 ? "…" : "") },
        ]}
        backHref="/reports"
      />

      {/* Report Header & Tri-State Badges */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">
            {report.category}
          </span>
          {report.is_synthetic_demo && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-100 text-amber-900">
              SYNTHETIC DEMONSTRATION RECORD
            </span>
          )}
          {report.external_ref_id && (
            <span className="text-xs text-slate-500">Ref: {report.external_ref_id}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">{report.title}</h1>
        <p className="text-sm text-slate-700 mb-3">{report.description}</p>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          GVMC Ward 18 ({report.lat}, {report.lng}){report.landmark ? ` • ${report.landmark}` : ""}
        </p>

        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <div className="text-slate-500 mb-0.5">1. External Portal Status</div>
            <div className="font-semibold text-slate-900 capitalize">
              {report.external_status.replaceAll("_", " ")}
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
            <div className="text-blue-700 mb-0.5">2. Provisional AI Assessment</div>
            <div className="font-semibold text-blue-950 capitalize">{report.assessment_status}</div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <div className="text-amber-800 mb-0.5">3. Citizen Review Decision</div>
            <div className="font-semibold text-amber-950 capitalize">
              {report.citizen_review.replaceAll("_", " ")}
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side Before & After Evidence */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h2 className="font-semibold text-sm mb-3">Before Photo (Initial Evidence)</h2>
          {beforeEv ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/reports/${report.id}/evidence/${beforeEv.id}`}
                alt={`Before photo for ${report.title}`}
                className="w-full h-60 object-cover rounded-xl border border-slate-200 bg-slate-100"
              />
              <p className="mt-2 text-[11px] text-slate-500 font-mono truncate">
                SHA-256: {beforeEv.sha256_hash}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No Before photo attached.</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h2 className="font-semibold text-sm mb-3">After Photo (Closure / Follow-Up Evidence)</h2>
          {afterEv ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/reports/${report.id}/evidence/${afterEv.id}`}
                alt={`After photo for ${report.title}`}
                className="w-full h-60 object-cover rounded-xl border border-slate-200 bg-slate-100"
              />
              <p className="mt-2 text-[11px] text-slate-500 font-mono truncate">
                SHA-256: {afterEv.sha256_hash}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600 mb-2">Need to attach a clearer follow-up photo?</p>
                <AddAfterPhotoForm reportId={report.id} />
              </div>
            </div>
          ) : (
            <AddAfterPhotoForm reportId={report.id} />
          )}
        </div>
      </section>

      {/* Batch 3: Provisional AI Assessment */}
      <RunAssessmentPanel
        reportId={report.id}
        hasBefore={Boolean(beforeEv)}
        hasAfter={Boolean(afterEv)}
        hasPiiFlag={hasPiiFlag}
        latestAssessment={latestAssessment}
      />

      {/* Batch 4: Citizen Control & Public Sharing */}
      <CitizenDecisionPanel
        reportId={report.id}
        currentDecision={report.citizen_review}
        latestNote={latestReview?.factual_note ?? ""}
        isPublicShared={Boolean(report.is_public_shared)}
        publicSummary={report.public_summary ?? ""}
        hasPiiFlag={hasPiiFlag}
      />

      {/* Audit Timeline */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" /> Audit Timeline
        </h2>
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
          {(events ?? []).map((ev) => (
            <li key={ev.id} className="text-sm">
              <p className="font-medium text-slate-900">{ev.summary}</p>
              <p className="text-xs text-slate-500">{new Date(ev.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
    </>
  );
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-slate-900 py-6 px-4">
      <Suspense fallback={<ReportDetailSkeleton />}>
        <ReportDetailContent params={params} />
      </Suspense>
    </main>
  );
}