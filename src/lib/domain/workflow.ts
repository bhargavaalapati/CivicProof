import {
  AssessmentStatus,
  CitizenReview,
  CitizenReviewSchema,
  EvidenceAssessmentContract,
  EvidenceAssessmentContractSchema,
  ExternalStatus,
} from "./contracts";

export interface ReportWorkflowState {
  id: string;
  ownerId: string;
  externalStatus: ExternalStatus;
  citizenReview: CitizenReview;
  assessmentStatus: AssessmentStatus;
  hasBeforeEvidence: boolean;
  hasAfterEvidence: boolean;
  latestAssessment?: EvidenceAssessmentContract;
}

/**
 * Rule 1: Updating external municipal status (even to 'marked_resolved')
 * MUST NEVER automatically mutate citizenReview to 'confirmed'.
 */
export function applyExternalStatusUpdate(
  report: ReportWorkflowState,
  newExternalStatus: ExternalStatus
): ReportWorkflowState {
  return {
    ...report,
    externalStatus: newExternalStatus,
    // citizenReview is intentionally untouched
  };
}

/**
 * Rule 2: Recording an AI assessment validates the schema and normalizes unsafe
 * conclusions, and NEVER mutates citizenReview.
 */
export function applyAiAssessmentResult(
  report: ReportWorkflowState,
  rawAssessment: unknown
): ReportWorkflowState {
  if (!report.hasBeforeEvidence || !report.hasAfterEvidence) {
    throw new Error(
      "Cannot record comparative assessment without both before and after evidence."
    );
  }

  const parsed = EvidenceAssessmentContractSchema.safeParse(rawAssessment);
  if (!parsed.success) {
    return {
      ...report,
      assessmentStatus: "failed",
    };
  }

  return {
    ...report,
    assessmentStatus: "complete",
    latestAssessment: parsed.data,
    // citizenReview remains strictly under human control
  };
}

/**
 * Rule 3: Only the authenticated report owner can record a citizen review decision.
 */
export function applyCitizenDecision(
  report: ReportWorkflowState,
  actorUserId: string,
  decision: CitizenReview,
  note?: string
): ReportWorkflowState {
  if (report.ownerId !== actorUserId) {
    throw new Error("Unauthorized: Only the report owner can record a review decision.");
  }

  const validDecision = CitizenReviewSchema.parse(decision);
  if (validDecision === "not_reviewed") {
    throw new Error("Citizen decision must be confirmed, disputed, or more_evidence_needed.");
  }

  if (validDecision === "disputed" && (!note || note.trim().length < 10)) {
    throw new Error("Disputing a closure requires a short factual explanation (min 10 chars).");
  }

  return {
    ...report,
    citizenReview: validDecision,
  };
}