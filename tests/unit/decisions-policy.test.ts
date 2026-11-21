import { describe, it, expect } from "vitest";
import { derivePolicyFromDecisions } from "../../src/lib/ai/decisions-client";
import { checkUserRateLimit } from "../../src/lib/security/rate-limit";

describe("CivicProof Batch 3 — Stage 1 Decisions Policy & Rate Limit", () => {
  it("forces uncertain + insufficient_evidence when any critical confidence is below 0.7", () => {
    const policy = derivePolicyFromDecisions({
      is_civic_scene: { noul: 0.95, confidence: 0.95 },
      has_visible_pii: { noul: 0.05, confidence: 0.95 },
      category: { choice: "pothole", confidence: 0.91 },
      same_location: { score: 1.9, confidence: 0.62 }, // Below 0.7!
      visible_change: { choice: "improved", confidence: 0.88 },
    });

    expect(policy.lockedSceneComparability).toBe("uncertain");
    expect(policy.lockedVisibleChange).toBe("insufficient_evidence");
    expect(policy.lockedRequiresHumanReview).toBe(true);
    expect(policy.lockedNextStep).toBe("request_clearer_photo");
  });

  it("forces likely_different + insufficient_evidence when same_location is level 0", () => {
    const policy = derivePolicyFromDecisions({
      is_civic_scene: { noul: 0.96, confidence: 0.96 },
      has_visible_pii: { noul: 0.04, confidence: 0.96 },
      category: { choice: "garbage", confidence: 0.94 },
      same_location: { score: 0.12, confidence: 0.91 },
      visible_change: { choice: "improved", confidence: 0.85 },
    });

    expect(policy.lockedSceneComparability).toBe("likely_different");
    expect(policy.lockedVisibleChange).toBe("insufficient_evidence");
    expect(policy.lockedRequiresHumanReview).toBe(true);
  });

  it("flags PII when has_visible_pii probability is high or confidence is uncertain", () => {
    const policy = derivePolicyFromDecisions({
      is_civic_scene: { noul: 0.94, confidence: 0.94 },
      has_visible_pii: { noul: 0.78, confidence: 0.78 },
      category: { choice: "pothole", confidence: 0.9 },
      same_location: { score: 1.92, confidence: 0.89 },
      visible_change: { choice: "improved", confidence: 0.86 },
    });

    expect(policy.piiFlagged).toBe(true);
    expect(policy.lockedSceneComparability).toBe("likely_same");
    expect(policy.lockedVisibleChange).toBe("improved");
    expect(policy.lockedRequiresHumanReview).toBe(true);
  });

  it("enforces per-user sliding-window rate limits", () => {
    const uid = `rate-test-${Date.now()}`;
    expect(checkUserRateLimit(uid, 2, 60_000).allowed).toBe(true);
    expect(checkUserRateLimit(uid, 2, 60_000).allowed).toBe(true);
    const blocked = checkUserRateLimit(uid, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});