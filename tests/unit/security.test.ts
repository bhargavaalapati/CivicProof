import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { isWithinWard18, CreateReportInputSchema } from "../../src/lib/domain/locality";
import { detectImageSignature, sanitizeAndPrepareEvidence } from "../../src/lib/security/media";

describe("CivicProof Batch 2 — Locality & Media Safety Guards", () => {
  it("accepts coordinates inside GVMC Ward 18 and rejects locations outside it", () => {
    expect(isWithinWard18(17.742, 83.336)).toBe(true);
    expect(isWithinWard18(12.9716, 77.5946)).toBe(false); // Bengaluru rejected

    const invalid = CreateReportInputSchema.safeParse({
      category: "pothole",
      title: "Outside ward test",
      description: "Trying to submit outside MVP Colony ward bounds.",
      lat: 12.9716,
      lng: 77.5946,
      ai_consent_acknowledged: true,
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects spoofed text/HTML files disguised with a .jpg extension via magic-byte check", async () => {
    const fakeJpg = Buffer.from("<html><script>alert(1)</script></html>");
    expect(detectImageSignature(fakeJpg)).toBeNull();

    await expect(
      sanitizeAndPrepareEvidence({
        rawBuffer: fakeJpg,
        userId: "user-1",
        reportId: "rep-1",
        phase: "before",
      })
    ).rejects.toThrow(/invalid image signature/i);
  });

  it("re-encodes a valid PNG into a sanitized JPEG derivative with a UUID path and SHA-256 hash", async () => {
    const validPng = await sharp({
      create: { width: 120, height: 80, channels: 3, background: { r: 80, g: 120, b: 200 } },
    })
      .png()
      .toBuffer();

    expect(detectImageSignature(validPng)).toBe("png");

    const result = await sanitizeAndPrepareEvidence({
      rawBuffer: validPng,
      userId: "user-123",
      reportId: "rep-456",
      phase: "before",
    });

    expect(detectImageSignature(result.jpegBuffer)).toBe("jpeg");
    expect(result.storagePath).toMatch(/^user-123\/rep-456\/before-[0-9a-f-]+\.jpg$/);
    expect(result.sha256Hash).toHaveLength(64);
  });
});