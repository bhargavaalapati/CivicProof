// src/app/reports/[id]/export/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { EvidenceAssessmentContract } from "@/lib/domain/contracts";
import { PrintPacketButton } from "@/components/reports/PrintPacketButton";
import { ArrowLeft } from "lucide-react";

async function ExportPacketContent({
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
  const latestAssessment = assessments?.[0] ?? null;
  const aiOutput = (latestAssessment?.structured_output ?? null) as EvidenceAssessmentContract | null;
  const latestReview = reviews?.[0] ?? null;
  const generatedTimestamp = new Date().toISOString();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (Hidden in PDF Print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/reports/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to report workspace
        </Link>
        <PrintPacketButton reportId={id} />
      </div>

      {/* Printable Document Sheet */}
      <article className="bg-white border border-slate-300 print:border-0 rounded-2xl print:rounded-none p-6 sm:p-10 space-y-6 shadow-sm print:shadow-none">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
            <span>CivicProof • Factual Follow-Up Evidence Packet</span>
            <span>Independent Prototype — Not Officially Submitted</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
          <p className="text-xs text-slate-600 mt-2">
            Packet Timestamp (UTC): <span className="font-mono">{generatedTimestamp}</span> • Report ID:{" "}
            <span className="font-mono">{report.id}</span>
          </p>
          {report.is_synthetic_demo && (
            <p className="mt-2 inline-block text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-950">
              SYNTHETIC DEMONSTRATION DATA — FOR EVALUATION ONLY
            </p>
          )}
        </header>

        {/* Report Facts */}
        <section className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p>
              <strong>Locality:</strong> GVMC Ward 18 – MVP Colony, Visakhapatnam
            </p>
            <p>
              <strong>Coordinates:</strong> {report.lat}, {report.lng}
            </p>
            {report.landmark && (
              <p>
                <strong>Landmark:</strong> {report.landmark}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p>
              <strong>Category:</strong> <span className="capitalize">{report.category}</span>
            </p>
            <p>
              <strong>External Portal Reference:</strong> {report.external_ref_id || "Not provided"}
            </p>
            <p>
              <strong>External Portal Status:</strong>{" "}
              <span className="capitalize">{report.external_status.replaceAll("_", " ")}</span>
            </p>
          </div>
        </section>

        <section className="text-sm">
          <h2 className="font-bold text-base mb-1">Citizen Issue Description</h2>
          <p className="text-slate-700">{report.description}</p>
        </section>

        {/* Citizen Decision Block */}
        <section className="rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-1.5 text-sm">
          <h2 className="font-bold text-base">Citizen Review Decision (Authoritative)</h2>
          <p>
            <strong>Decision:</strong>{" "}
            <span className="uppercase font-semibold">{report.citizen_review.replaceAll("_", " ")}</span>
          </p>
          {latestReview?.factual_note && (
            <p>
              <strong>Citizen Factual Note:</strong> {latestReview.factual_note}
            </p>
          )}
          {latestReview?.created_at && (
            <p className="text-xs text-slate-500">
              Recorded at: {new Date(latestReview.created_at).toISOString()}
            </p>
          )}
        </section>

        {/* Before / After Evidence Pair */}
        <section className="space-y-2">
          <h2 className="font-bold text-base">Supplied Before &amp; After Photographs (EXIF Stripped)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold mb-2">BEFORE PHOTO</p>
              {beforeEv ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/reports/${report.id}/evidence/${beforeEv.id}`}
                    alt="Before evidence photograph"
                    className="w-full h-52 object-cover rounded-lg border border-slate-200"
                  />
                  <p className="mt-1.5 text-[10px] font-mono text-slate-600 break-all">
                    SHA-256: {beforeEv.sha256_hash}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Not attached</p>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold mb-2">AFTER / CLOSURE PHOTO</p>
              {afterEv ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/reports/${report.id}/evidence/${afterEv.id}`}
                    alt="After closure evidence photograph"
                    className="w-full h-52 object-cover rounded-lg border border-slate-200"
                  />
                  <p className="mt-1.5 text-[10px] font-mono text-slate-600 break-all">
                    SHA-256: {afterEv.sha256_hash}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Not attached</p>
              )}
            </div>
          </div>
        </section>

        {/* Provisional AI Observations Block */}
        <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2 text-sm">
          <h2 className="font-bold text-base text-slate-900">
            Provisional AI Visual Observations (Non-Authoritative)
          </h2>
          {aiOutput && latestAssessment ? (
            <>
              <p>
                <strong>Scene Comparability:</strong> {aiOutput.scene_comparability.replaceAll("_", " ")} •{" "}
                <strong>Visible Change:</strong> {aiOutput.visible_change.replaceAll("_", " ")}
              </p>
              <div>
                <strong className="text-xs uppercase text-slate-700">Observations:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {aiOutput.observations.map((obs, idx) => (
                    <li key={idx}>
                      <span className="uppercase font-semibold text-xs">[{obs.image}]</span> {obs.observation}
                    </li>
                  ))}
                </ul>
              </div>
              {aiOutput.limitations.length > 0 && (
                <div>
                  <strong className="text-xs uppercase text-amber-900">Limitations:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-amber-950">
                    {aiOutput.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[11px] font-mono text-slate-600 pt-2 border-t border-blue-200">
                Models: {latestAssessment.stage1_model_id} + {latestAssessment.stage2_model_id} • Prompt Version:{" "}
                {latestAssessment.prompt_version} • Assessed: {new Date(latestAssessment.created_at).toISOString()}
              </p>
            </>
          ) : (
            <p className="text-slate-600">No provisional AI assessment has been run for this report.</p>
          )}
        </section>

        {/* Timeline */}
        <section className="text-sm">
          <h2 className="font-bold text-base mb-2">Chronological Audit Timeline</h2>
          <ol className="space-y-1.5 border-l-2 border-slate-200 pl-4">
            {(events ?? []).map((ev) => (
              <li key={ev.id}>
                <span className="font-mono text-xs text-slate-500">
                  {new Date(ev.created_at).toISOString()}
                </span>{" "}
                — <span>{ev.summary}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Mandatory Boundaries & Non-Legal Footer */}
        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-1">
          <p>
            <strong>Important Notice &amp; Scope Boundaries:</strong> CivicProof is an independent evidence-organization
            prototype. It is not affiliated with GVMC or any government authority, and generating this packet does not
            automatically submit a complaint.
          </p>
          <p>
            Provisional AI observations assess only whether the supplied images visibly correspond to one another. They
            do not certify road safety, prove official misconduct, authenticate image origin, or constitute legal advice.
            SHA-256 hashes confirm file integrity within this workspace only.
          </p>
        </footer>
      </article>
    </div>
  );
}

export default function ExportPacketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen bg-[#FAF9F6] print:bg-white text-slate-900 py-6 px-4 print:p-0">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        }
      >
        <ExportPacketContent params={params} />
      </Suspense>
    </main>
  );
}