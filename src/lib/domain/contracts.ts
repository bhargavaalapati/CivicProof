import { z } from "zod";

// ============================================================================
// 1. PRODUCT SCOPE CONSTANTS (Phase 1 Narrow MVP Boundary)
// ============================================================================
export const CONFIGURED_LOCALITY = {
  id: "gvmc-ward-18-mvp",
  name: "GVMC Ward 18 — MVP Colony, Visakhapatnam",
  bounds: {
    minLat: 17.732,
    maxLat: 17.752,
    minLng: 83.325,
    maxLng: 83.348,
  },
} as const;

export const IssueCategorySchema = z.enum(["pothole", "garbage"]);
export type IssueCategory = z.infer<typeof IssueCategorySchema>;

// ============================================================================
// 2. STRICT STATE SEPARATION (Municipal Status != Citizen Confirmation)
// ============================================================================
export const ExternalStatusSchema = z.enum([
  "unknown",
  "submitted_by_user",
  "acknowledged",
  "marked_resolved",
]);
export type ExternalStatus = z.infer<typeof ExternalStatusSchema>;

export const CitizenReviewSchema = z.enum([
  "not_reviewed",
  "confirmed",
  "disputed",
  "more_evidence_needed",
]);
export type CitizenReview = z.infer<typeof CitizenReviewSchema>;

export const AssessmentStatusSchema = z.enum([
  "pending",
  "complete",
  "failed",
]);
export type AssessmentStatus = z.infer<typeof AssessmentStatusSchema>;

export const EvidencePhaseSchema = z.enum(["before", "after"]);
export type EvidencePhase = z.infer<typeof EvidencePhaseSchema>;

// ============================================================================
// 3. AI OUTPUT CONTRACT (Validated Structured Schema — No Fake % Scores)
// ============================================================================
export const SceneComparabilitySchema = z.enum([
  "likely_same",
  "uncertain",
  "likely_different",
]);

export const VisibleChangeSchema = z.enum([
  "improved",
  "unchanged",
  "worsened",
  "insufficient_evidence",
]);

export const RecommendedNextStepSchema = z.enum([
  "confirm_with_user",
  "request_clearer_photo",
  "human_review",
]);

export const ObservationItemSchema = z.object({
  image: EvidencePhaseSchema,
  observation: z.string().min(5).max(300),
});

export const EvidenceAssessmentContractSchema = z
  .object({
    scene_comparability: SceneComparabilitySchema,
    visible_change: VisibleChangeSchema,
    observations: z.array(ObservationItemSchema).min(1).max(8),
    limitations: z.array(z.string().min(5).max(300)).max(6),
    recommended_next_step: RecommendedNextStepSchema,
    requires_human_review: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // SAFETY INVARIANT 1: If images are not comparable, AI must NEVER claim the issue is 'improved'.
    if (
      data.scene_comparability !== "likely_same" &&
      data.visible_change === "improved"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visible_change"],
        message:
          "Cannot conclude 'improved' when scene_comparability is uncertain or likely_different.",
      });
    }

    // SAFETY INVARIANT 2: Every assessment requires human review when comparability is not likely_same.
    if (
      data.scene_comparability !== "likely_same" &&
      !data.requires_human_review
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requires_human_review"],
        message:
          "requires_human_review must be true whenever scene_comparability is not likely_same.",
      });
    }
  });

export type EvidenceAssessmentContract = z.infer<
  typeof EvidenceAssessmentContractSchema
>;

// ============================================================================
// 4. STAGE-1 GEMINI DECISIONS API RUBRIC CONTRACT (gemini-decision-1)
// ============================================================================
export const GeminiDecisionTriageSchema = z.object({
  is_valid_outdoor_scene: z.boolean(),
  contains_visible_pii: z.boolean(),
  detected_category: z.enum(["pothole", "garbage", "unclear"]),
  // Rubric score 0 = likely_different, 1 = uncertain, 2 = likely_same
  comparability_rubric_score: z.number().int().min(0).max(2),
  visible_change_choice: VisibleChangeSchema,
});
export type GeminiDecisionTriage = z.infer<typeof GeminiDecisionTriageSchema>;