// tests/unit/intake-guard.test.ts
import { describe, it, expect } from "vitest";
import { evaluateIntakeDecision } from "@/lib/ai/intake-guard";

describe("CivicProof Sprint 7 — Multi-Signal Upload Intake Gatekeeper", () => {
  it("blocks Amazon product photos even when noul omits an explicit confidence field", () => {
    const result = evaluateIntakeDecision(
      {
        is_outdoor_civic_scene: { noul: 0.04 }, // confidence derived automatically -> 0.96
        is_screenshot_or_product_ui: { noul: 0.1 },
        is_ai_generated_or_synthetic: { noul: 0.05 },
        detected_issue_category: { choice: "other", confidence: 0.92 },
        has_visible_pii: { noul: 0.05 },
      },
      { selectedCategory: "pothole", phase: "before" }
    );

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("rejected_non_civic");
  });

  it("blocks screenshots, shopping app pages, and photos of another screen", () => {
    const result = evaluateIntakeDecision(
      {
        is_outdoor_civic_scene: { noul: 0.82, confidence: 0.82 },
        is_screenshot_or_product_ui: { noul: 0.91, confidence: 0.91 },
        is_ai_generated_or_synthetic: { noul: 0.1, confidence: 0.9 },
        detected_issue_category: { choice: "pothole", confidence: 0.8 },
        has_visible_pii: { noul: 0.05, confidence: 0.95 },
      },
      { selectedCategory: "pothole", phase: "after" }
    );

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("rejected_screenshot_or_ui");
  });

  it("blocks clearly AI-generated or digitally fabricated street renders", () => {
    const result = evaluateIntakeDecision(
      {
        is_outdoor_civic_scene: { noul: 0.9, confidence: 0.9 },
        is_screenshot_or_product_ui: { noul: 0.04, confidence: 0.96 },
        is_ai_generated_or_synthetic: { noul: 0.89, confidence: 0.89 },
        detected_issue_category: { choice: "clean_road", confidence: 0.85 },
        has_visible_pii: { noul: 0.05, confidence: 0.95 },
      },
      { selectedCategory: "pothole", phase: "after" }
    );

    expect(result.allowed).toBe(false);
    expect(result.status).toBe("rejected_synthetic_or_ai");
    expect(result.syntheticWarning).toBe(true);
  });

  it("allows authentic outdoor street photos, flags PII, suggests category fixes, and notes missing EXIF", () => {
    const result = evaluateIntakeDecision(
      {
        is_outdoor_civic_scene: { noul: 0.95, confidence: 0.95 },
        is_screenshot_or_product_ui: { noul: 0.03, confidence: 0.97 },
        is_ai_generated_or_synthetic: { noul: 0.08, confidence: 0.92 },
        detected_issue_category: { choice: "garbage", confidence: 0.88 },
        has_visible_pii: { noul: 0.84, confidence: 0.84 },
      },
      { selectedCategory: "pothole", phase: "before", hadExifMetadata: false }
    );

    expect(result.allowed).toBe(true);
    expect(result.piiFlagged).toBe(true);
    expect(result.categorySuggestion).toBe("garbage");
    expect(result.warnings.some((w) => w.includes("EXIF"))).toBe(true);
  });

  it("allows dark/blurry outdoor street photos with a warning instead of locking out citizens", () => {
    const result = evaluateIntakeDecision(
      {
        is_outdoor_civic_scene: { noul: 0.44, confidence: 0.56 },
        is_screenshot_or_product_ui: { noul: 0.1, confidence: 0.9 },
        is_ai_generated_or_synthetic: { noul: 0.12, confidence: 0.88 },
        detected_issue_category: { choice: "other", confidence: 0.55 },
        has_visible_pii: { noul: 0.08, confidence: 0.92 },
      },
      { selectedCategory: "pothole", phase: "before", hadExifMetadata: true }
    );

    expect(result.allowed).toBe(true);
    expect(result.status).toBe("allowed_with_warnings");
  });
});