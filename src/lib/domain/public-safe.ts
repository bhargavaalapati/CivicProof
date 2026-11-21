import {
  AssessmentStatus,
  CitizenReview,
  EvidenceAssessmentContract,
  ExternalStatus,
  IssueCategory,
} from "./contracts";

export interface RawReportForPublic {
  id: string;
  owner_id: string;
  category: IssueCategory;
  title: string;
  lat: number;
  lng: number;
  landmark: string | null;
  external_status: ExternalStatus;
  citizen_review: CitizenReview;
  assessment_status: AssessmentStatus;
  is_synthetic_demo: boolean;
  is_public_shared: boolean;
  public_summary: string;
  created_at: string;
}

export interface RawEvidenceForPublic {
  id: string;
  phase: "before" | "after";
  has_pii_flag: boolean;
  sha256_hash: string;
  created_at: string;
}

export interface PublicSafeReportView {
  id: string;
  category: IssueCategory;
  title: string;
  approximateLocation: {
    locality: string;
    approxLat: number;
    approxLng: number;
  };
  externalStatus: ExternalStatus;
  citizenReview: CitizenReview;
  citizenApprovedSummary: string;
  isSyntheticDemo: boolean;
  provisionalAssessment: {
    sceneComparability: EvidenceAssessmentContract["scene_comparability"];
    visibleChange: EvidenceAssessmentContract["visible_change"];
    limitationsCount: number;
    promptVersion: string;
  } | null;
  mediaStatus: {
    piiWithheld: boolean;
    beforeEvidenceId: string | null;
    afterEvidenceId: string | null;
  };
  createdAt: string;
}

/**
 * Projects an internal report into a privacy-safe public view.
 * Returns null if the report is not explicitly shared or lacks a citizen decision.
 */
export function buildPublicSafeReportView(params: {
  report: RawReportForPublic;
  evidence: RawEvidenceForPublic[];
  latestAssessment?: {
    prompt_version: string;
    structured_output: EvidenceAssessmentContract | null;
  } | null;
}): PublicSafeReportView | null {
  const { report, evidence, latestAssessment } = params;

  if (!report.is_public_shared || report.citizen_review === "not_reviewed") {
    return null;
  }

  const piiWithheld = evidence.some((e) => e.has_pii_flag);
  const beforeEv = evidence.find((e) => e.phase === "before");
  const afterEv = evidence.find((e) => e.phase === "after");

  const safeSummary =
    report.public_summary.trim() ||
    `Citizen marked this ${report.category} report as "${report.citizen_review.replaceAll("_", " ")}".`;

  return {
    id: report.id,
    category: report.category,
    title: report.title,
    approximateLocation: {
      locality: "GVMC Ward 18 – MVP Colony, Visakhapatnam",
      approxLat: Number(report.lat.toFixed(3)),
      approxLng: Number(report.lng.toFixed(3)),
    },
    externalStatus: report.external_status,
    citizenReview: report.citizen_review,
    citizenApprovedSummary: safeSummary,
    isSyntheticDemo: report.is_synthetic_demo,
    provisionalAssessment: latestAssessment?.structured_output
      ? {
          sceneComparability: latestAssessment.structured_output.scene_comparability,
          visibleChange: latestAssessment.structured_output.visible_change,
          limitationsCount: latestAssessment.structured_output.limitations.length,
          promptVersion: latestAssessment.prompt_version,
        }
      : null,
    mediaStatus: {
      piiWithheld,
      beforeEvidenceId: piiWithheld ? null : beforeEv?.id ?? null,
      afterEvidenceId: piiWithheld ? null : afterEv?.id ?? null,
    },
    createdAt: report.created_at,
  };
}