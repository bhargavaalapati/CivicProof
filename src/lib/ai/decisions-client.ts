import { GoogleGenAI } from "@google/genai";
import {
  AI_CONFIDENCE_THRESHOLD,
  AI_TIMEOUT_MS,
  STAGE1_MODEL_ID,
} from "./prompts";
import {
  EvidenceAssessmentContract,
  VisibleChangeSchema,
} from "@/lib/domain/contracts";

export interface RawDecisionAnswers {
  is_civic_scene?: { type?: string; noul?: number; confidence?: number };
  has_visible_pii?: { type?: string; noul?: number; confidence?: number };
  category?: {
    type?: string;
    choice?: string;
    probabilities?: Record<string, number>;
    confidence?: number;
  };
  same_location?: {
    type?: string;
    score?: number;
    probabilities?: Record<string, number> | number[];
    confidence?: number;
  };
  visible_change?: {
    type?: string;
    choice?: string;
    probabilities?: Record<string, number>;
    confidence?: number;
  };
}

export interface Stage1DerivedPolicy {
  isCivicScene: boolean;
  piiFlagged: boolean;
  detectedCategory: "pothole" | "garbage" | "other";
  lockedSceneComparability: EvidenceAssessmentContract["scene_comparability"];
  lockedVisibleChange: EvidenceAssessmentContract["visible_change"];
  lockedNextStep: EvidenceAssessmentContract["recommended_next_step"];
  lockedRequiresHumanReview: boolean;
  policyReasons: string[];
  rawAnswers: RawDecisionAnswers;
}

/**
 * Pure deterministic policy combiner (unit-tested in tests/unit/decisions-policy.test.ts).
 * Uses calibrated probabilities/confidence strictly to drive safe routing — never exposed as "% verified".
 */
export function derivePolicyFromDecisions(
  answers: RawDecisionAnswers,
  threshold = AI_CONFIDENCE_THRESHOLD
): Stage1DerivedPolicy {
  const policyReasons: string[] = [];

  const civicAns = answers.is_civic_scene;
  const piiAns = answers.has_visible_pii;
  const catAns = answers.category;
  const locAns = answers.same_location;
  const changeAns = answers.visible_change;

  const isCivicYes = (civicAns?.noul ?? 0) >= 0.5;
  const isCivicConfident = (civicAns?.confidence ?? 0) >= threshold;

  // Fail-closed on privacy: flag PII if probability >= 0.45 OR confidence is too low to be sure it's clean
  const piiProb = piiAns?.noul ?? 1;
  const piiConf = piiAns?.confidence ?? 0;
  const piiFlagged = piiProb >= 0.45 || piiConf < threshold;
  if (piiFlagged) {
    policyReasons.push(
      "Possible visible face or vehicle registration plate flagged for privacy protection."
    );
  }

  const rawCat = catAns?.choice;
  const detectedCategory: "pothole" | "garbage" | "other" =
    rawCat === "pothole" || rawCat === "garbage" ? rawCat : "other";

  // Check whether ANY critical judgment has confidence below 0.7
  const criticalConfidences = [
    civicAns?.confidence ?? 0,
    locAns?.confidence ?? 0,
    changeAns?.confidence ?? 0,
  ];
  const hasLowConfidence = criticalConfidences.some((c) => c < threshold);

  // Extract same_location level (0 = likely_different, 1 = uncertain, 2 = likely_same)
  const locScore = typeof locAns?.score === "number" ? locAns.score : 1;
  const locConf = locAns?.confidence ?? 0;
  const isClearlyLevel2 = locScore >= 1.65 && locConf >= threshold;
  const isClearlyLevel0 = locScore <= 0.35 && locConf >= threshold;

  // Guard 1: Non-civic upload (selfie, screenshot, blank frame)
  if (!isCivicYes || !isCivicConfident) {
    policyReasons.push(
      "At least one uploaded photo does not clearly depict an outdoor civic street scene."
    );
    return {
      isCivicScene: false,
      piiFlagged,
      detectedCategory,
      lockedSceneComparability: "uncertain",
      lockedVisibleChange: "insufficient_evidence",
      lockedNextStep: "request_clearer_photo",
      lockedRequiresHumanReview: true,
      policyReasons,
      rawAnswers: answers,
    };
  }

  // Guard 2: Clearly different locations (Level 0 with high confidence)
  if (isClearlyLevel0) {
    policyReasons.push(
      "Stage-1 comparison indicates the BEFORE and AFTER photos appear to show different locations."
    );
    return {
      isCivicScene: true,
      piiFlagged,
      detectedCategory,
      lockedSceneComparability: "likely_different",
      lockedVisibleChange: "insufficient_evidence",
      lockedNextStep: "request_clearer_photo",
      lockedRequiresHumanReview: true,
      policyReasons,
      rawAnswers: answers,
    };
  }

  // Guard 3: Any confidence < 0.7 OR same_location is not clearly Level 2 -> force uncertain
  if (hasLowConfidence || !isClearlyLevel2) {
    policyReasons.push(
      "Scene comparability or visual change could not be established with sufficient certainty; clearer matched-angle evidence is recommended."
    );
    return {
      isCivicScene: true,
      piiFlagged,
      detectedCategory,
      lockedSceneComparability: "uncertain",
      lockedVisibleChange: "insufficient_evidence",
      lockedNextStep: "request_clearer_photo",
      lockedRequiresHumanReview: true,
      policyReasons,
      rawAnswers: answers,
    };
  }

  // Level 2 (likely_same) with confidence >= 0.7 across all checks
  const parsedChange = VisibleChangeSchema.safeParse(changeAns?.choice);
  const lockedVisibleChange = parsedChange.success
    ? parsedChange.data
    : "insufficient_evidence";

  return {
    isCivicScene: true,
    piiFlagged,
    detectedCategory,
    lockedSceneComparability: "likely_same",
    lockedVisibleChange,
    lockedNextStep:
      lockedVisibleChange === "insufficient_evidence"
        ? "request_clearer_photo"
        : "confirm_with_user",
    lockedRequiresHumanReview: true, // Always provisional; citizen holds final confirmation
    policyReasons,
    rawAnswers: answers,
  };
}

export async function runStage1Decisions(params: {
  beforeBuffer: Buffer;
  afterBuffer: Buffer;
  beforeMimeType: string;
  afterMimeType: string;
}): Promise<Stage1DerivedPolicy> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({
    apiKey,
    apiVersion: "v1beta",
  });

  const beforeBase64 = params.beforeBuffer.toString("base64");
  const afterBase64 = params.afterBuffer.toString("base64");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    // Call Gemini Decisions API in ONE atomic forward pass
    const decisionsApi = (ai as unknown as {
      decisions: {
        create: (args: Record<string, unknown>) => Promise<{ answers?: RawDecisionAnswers }>;
      };
    }).decisions;

    if (!decisionsApi || typeof decisionsApi.create !== "function") {
      throw new Error("DECISIONS_API_UNAVAILABLE_UPGRADE_SDK");
    }

    const result = await Promise.race([
      decisionsApi.create({
        model: STAGE1_MODEL_ID,
        input: [
          { type: "text", text: "BEFORE photo:" },
          {
            type: "image",
            data: beforeBase64,
            mime_type: params.beforeMimeType,
            resolution: "medium",
          },
          { type: "text", text: "AFTER photo:" },
          {
            type: "image",
            data: afterBase64,
            mime_type: params.afterMimeType,
            resolution: "medium",
          },
        ],
        questions: {
          is_civic_scene: {
            type: "noul",
            instructions:
              "Do both uploaded images depict outdoor public road, street, or civic environment scenes rather than selfies, phone screenshots, indoor rooms, or blank frames?",
          },
          has_visible_pii: {
            type: "noul",
            instructions:
              "Do either the BEFORE photo or the AFTER photo contain clearly recognizable human faces or readable vehicle registration number plates?",
          },
          category: {
            type: "choice",
            instructions:
              "Which civic infrastructure issue category best describes the problem shown in the BEFORE photo?",
            criteria: {
              pothole: "Road surface damage, crater, broken asphalt, or damaged road edge.",
              garbage: "Accumulated waste pile, overflowing bin, litter, or dumped debris.",
              other: "Any other issue, unclear subject, or non-civic content.",
            },
          },
          same_location: {
            type: "score",
            instructions:
              "How clearly do the BEFORE photo and AFTER photo depict the exact same physical street location and damaged area?",
            criteria: [
              "Likely different: landmarks, walls, surroundings, or road layout clearly belong to two different places.",
              "Uncertain: camera angle, framing, lighting, or obstruction makes it unclear whether the original spot is shown.",
              "Likely same: matching fixed landmarks, poles, walls, curbs, or geometry clearly confirm the same location and spot.",
            ],
          },
          visible_change: {
            type: "choice",
            instructions:
              "Comparing the BEFORE photo to the AFTER photo, what visible change occurred to the originally reported issue?",
            criteria: {
              improved: "The original pothole appears patched/filled or the garbage pile appears cleared in the same spot.",
              unchanged: "The same pothole or garbage pile remains visibly present with no meaningful improvement.",
              worsened: "The pothole damage or garbage accumulation appears noticeably larger or worse.",
              insufficient_evidence: "Images are from different places, too dark, obstructed, or cut off the original issue so change cannot be judged.",
            },
          },
        },
      }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("STAGE1_TIMEOUT")));
      }),
    ]);

    return derivePolicyFromDecisions(result.answers ?? {});
  } finally {
    clearTimeout(timeoutId);
  }
}