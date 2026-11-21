import { describe, it, expect } from "vitest";
import {
  applyExternalStatusUpdate,
  applyAiAssessmentResult,
  applyCitizenDecision,
  ReportWorkflowState,
} from "../../src/lib/domain/workflow";

const baseReport: ReportWorkflowState = {
  id: "rep-001",
  ownerId: "user-citizen-1",
  externalStatus: "submitted_by_user",
  citizenReview: "not_reviewed",
  assessmentStatus: "pending",
  hasBeforeEvidence: true,
  hasAfterEvidence: true,
};

describe("CivicProof Phase 1 — Domain Invariants & AI Contract Guards", () => {
  it("never marks citizenReview as confirmed when external municipal status becomes marked_resolved", () => {
    const updated = applyExternalStatusUpdate(baseReport, "marked_resolved");
    expect(updated.externalStatus).toBe("marked_resolved");
    expect(updated.citizenReview).toBe("not_reviewed");
  });

  it("rejects an AI assessment that claims 'improved' when scene_comparability is 'likely_different' (False Reassurance Guard)", () => {
    const unsafeAiOutput = {
      scene_comparability: "likely_different",
      visible_change: "improved", // Illegal combination!
      observations: [{ image: "after", observation: "Clean road surface shown." }],
      limitations: ["Background buildings do not match original photo."],
      recommended_next_step: "confirm_with_user",
      requires_human_review: true,
    };

    const updated = applyAiAssessmentResult(baseReport, unsafeAiOutput);
    expect(updated.assessmentStatus).toBe("failed");
    expect(updated.citizenReview).toBe("not_reviewed");
  });

  it("accepts a valid ambiguous AI assessment and keeps citizenReview as not_reviewed", () => {
    const validAmbiguousOutput = {
      scene_comparability: "uncertain",
      visible_change: "insufficient_evidence",
      observations: [
        { image: "after", observation: "The original damaged road edge is outside the frame." },
      ],
      limitations: ["Camera angle differs substantially from the before photo."],
      recommended_next_step: "request_clearer_photo",
      requires_human_review: true,
    };

    const updated = applyAiAssessmentResult(baseReport, validAmbiguousOutput);
    expect(updated.assessmentStatus).toBe("complete");
    expect(updated.latestAssessment?.visible_change).toBe("insufficient_evidence");
    expect(updated.citizenReview).toBe("not_reviewed");
  });

  it("blocks a different user from modifying citizenReview (Authorization Boundary)", () => {
    expect(() =>
      applyCitizenDecision(baseReport, "attacker-user-99", "confirmed")
    ).toThrow(/Unauthorized/);
  });

  it("requires a factual note when a citizen marks a closure as disputed", () => {
    expect(() =>
      applyCitizenDecision(baseReport, "user-citizen-1", "disputed", "no")
    ).toThrow(/factual explanation/);

    const disputed = applyCitizenDecision(
      baseReport,
      "user-citizen-1",
      "disputed",
      "Closure photo shows a different street corner without the transformer pole."
    );
    expect(disputed.citizenReview).toBe("disputed");
  });
});