import { describe, it, expect } from "vitest";
import { buildPublicSafeReportView, RawReportForPublic } from "@/lib/domain/public-safe";

const sampleReport: RawReportForPublic = {
  id: "rep-pub-1",
  owner_id: "secret-owner-uuid",
  category: "garbage",
  title: "Overflowing bin at Sector 2",
  lat: 17.73859,
  lng: 83.33184,
  landmark: "House #12 gate",
  external_status: "marked_resolved",
  citizen_review: "disputed",
  assessment_status: "complete",
  is_synthetic_demo: true,
  is_public_shared: true,
  public_summary: "Closure photo showed a different street corner.",
  created_at: "2026-11-21T00:00:00Z",
};

describe("CivicProof Batch 4 — Privacy-Safe Public Projection", () => {
  it("returns null when the citizen has not enabled public sharing or has not reviewed", () => {
    expect(
      buildPublicSafeReportView({
        report: { ...sampleReport, is_public_shared: false },
        evidence: [],
      })
    ).toBeNull();

    expect(
      buildPublicSafeReportView({
        report: { ...sampleReport, citizen_review: "not_reviewed" },
        evidence: [],
      })
    ).toBeNull();
  });

  it("withholds raw photos whenever any evidence item has has_pii_flag = true", () => {
    const view = buildPublicSafeReportView({
      report: sampleReport,
      evidence: [
        { id: "ev-b", phase: "before", has_pii_flag: false, sha256_hash: "aaa", created_at: "2026-11-21T00:00:00Z" },
        { id: "ev-a", phase: "after", has_pii_flag: true, sha256_hash: "bbb", created_at: "2026-11-21T00:05:00Z" },
      ],
    });

    expect(view).not.toBeNull();
    expect(view?.mediaStatus.piiWithheld).toBe(true);
    expect(view?.mediaStatus.beforeEvidenceId).toBeNull();
    expect(view?.mediaStatus.afterEvidenceId).toBeNull();
  });

  it("strips owner_id and rounds coordinates to ~110m precision (3 decimals)", () => {
    const view = buildPublicSafeReportView({
      report: sampleReport,
      evidence: [
        { id: "ev-b", phase: "before", has_pii_flag: false, sha256_hash: "aaa", created_at: "2026-11-21T00:00:00Z" },
      ],
    });

    expect(view).not.toBeNull();
    expect("owner_id" in (view as object)).toBe(false);
    expect(view?.approximateLocation.approxLat).toBe(17.739);
    expect(view?.approximateLocation.approxLng).toBe(83.332);
    expect(view?.mediaStatus.beforeEvidenceId).toBe("ev-b");
  });
});