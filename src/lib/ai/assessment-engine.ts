// src/lib/ai/assessment-engine.ts
import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  EvidenceAssessmentContract,
  EvidenceAssessmentContractSchema,
} from "@/lib/domain/contracts";
import { Stage1DerivedPolicy, runStage1Decisions } from "./decisions-client";
import {
  AI_TIMEOUT_MS,
  PROMPT_VERSION,
  STAGE1_MODEL_ID,
  STAGE2_MODEL_ID,
  STAGE2_SYSTEM_PROMPT,
} from "./prompts";

export interface FullAssessmentRunResult {
  stage1Policy: Stage1DerivedPolicy;
  assessment: EvidenceAssessmentContract;
  metadata: {
    stage1ModelId: string;
    stage2ModelId: string;
    promptVersion: string;
    durationMs: number;
  };
}

export async function runTwoStageAssessment(params: {
  beforeBuffer: Buffer;
  afterBuffer: Buffer;
  beforeMimeType: string;
  afterMimeType: string;
  category: string;
  landmark: string;
}): Promise<FullAssessmentRunResult> {
  const startedAt = Date.now();
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }

  // 1. STAGE 1: Fast calibrated multimodal triage (gemini-decision-1)
  const stage1Policy = await runStage1Decisions({
    beforeBuffer: params.beforeBuffer,
    afterBuffer: params.afterBuffer,
    beforeMimeType: params.beforeMimeType,
    afterMimeType: params.afterMimeType,
  });

  // 2. STAGE 2: Structured visual observations & limitations (gemini-2.5-flash)
  const google = createGoogleGenerativeAI({ apiKey });

  const stage1SummaryForPrompt = JSON.stringify({
    reported_category: params.category,
    user_landmark_note: params.landmark || "none provided",
    locked_stage1_scene_comparability: stage1Policy.lockedSceneComparability,
    locked_stage1_visible_change: stage1Policy.lockedVisibleChange,
    locked_stage1_recommended_next_step: stage1Policy.lockedNextStep,
    stage1_policy_notes: stage1Policy.policyReasons,
  });

  const { output: rawStage2 } = await generateText({
    model: google(STAGE2_MODEL_ID),
    output: Output.object({
      schema: EvidenceAssessmentContractSchema,
    }),
    system: STAGE2_SYSTEM_PROMPT,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Stage-1 locked triage decisions (you MUST respect locked_stage1_scene_comparability and locked_stage1_visible_change):\n${stage1SummaryForPrompt}\n\nImage 1 (BEFORE photo):`,
          },
          {
            type: "file",
            data: params.beforeBuffer,
            mediaType: params.beforeMimeType as "image/jpeg" | "image/png" | "image/webp",
          },
          {
            type: "text",
            text: "Image 2 (AFTER photo):",
          },
          {
            type: "file",
            data: params.afterBuffer,
            mediaType: params.afterMimeType as "image/jpeg" | "image/png" | "image/webp",
          },
          {
            type: "text",
            text: "Generate concise, factual before/after observations and explicit limitations for the citizen review card.",
          },
        ],
      },
    ],
  });

  if (!rawStage2) {
    throw new Error("STAGE2_EMPTY_OUTPUT");
  }

  // 3. HARD CODE ENFORCEMENT: Stage 2 can NEVER weaken Stage 1 safety locks
  const enforcedCandidate = {
    scene_comparability: stage1Policy.lockedSceneComparability,
    visible_change: stage1Policy.lockedVisibleChange,
    observations: rawStage2.observations,
    limitations: Array.from(
      new Set([...stage1Policy.policyReasons, ...rawStage2.limitations])
    ).slice(0, 6),
    recommended_next_step: stage1Policy.lockedNextStep,
    requires_human_review: true,
  };

  const validated = EvidenceAssessmentContractSchema.parse(enforcedCandidate);

  return {
    stage1Policy,
    assessment: validated,
    metadata: {
      stage1ModelId: STAGE1_MODEL_ID,
      stage2ModelId: STAGE2_MODEL_ID,
      promptVersion: PROMPT_VERSION,
      durationMs: Date.now() - startedAt,
    },
  };
}