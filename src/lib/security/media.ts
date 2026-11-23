import crypto from "crypto";
import sharp from "sharp";
import { EvidencePhase } from "@/lib/domain/contracts";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_INPUT_PIXELS = 25_000_000; // Decompression-bomb ceiling (~5000x5000)

export type DetectedImageFormat = "jpeg" | "png" | "webp";

/**
 * Inspects actual binary magic bytes rather than trusting file.type or filename.
 */
export function detectImageSignature(buffer: Buffer): DetectedImageFormat | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

// In src/lib/security/media.ts — update interface and sanitizeAndPrepareEvidence:
export interface SanitizedEvidenceResult {
  jpegBuffer: Buffer;
  sha256Hash: string;
  storagePath: string;
  width: number;
  height: number;
  sizeBytes: number;
  hadExifMetadata: boolean;
}

export async function sanitizeAndPrepareEvidence(params: {
  rawBuffer: Buffer;
  userId: string;
  reportId: string;
  phase: EvidencePhase;
}): Promise<SanitizedEvidenceResult> {
  const { rawBuffer, userId, reportId, phase } = params;

  if (rawBuffer.length === 0) {
    throw new Error("Uploaded file is empty.");
  }
  if (rawBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds the 5 MB safety limit.");
  }

  const detected = detectImageSignature(rawBuffer);
  if (!detected) {
    throw new Error(
      "Unsupported or invalid image signature. Only real JPEG, PNG, or WebP images are accepted."
    );
  }

  const rawMeta = await sharp(rawBuffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  const hadExifMetadata = Boolean(rawMeta.exif && rawMeta.exif.length > 0);

  // Auto-orient via EXIF then strip ALL EXIF/GPS metadata by re-encoding to clean JPEG
  const pipeline = sharp(rawBuffer, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true });

  const { data: jpegBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

  if (jpegBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("Processed image derivative exceeds 5 MB limit.");
  }

  const sha256Hash = crypto.createHash("sha256").update(jpegBuffer).digest("hex");
  const safeFilename = `${phase}-${crypto.randomUUID()}.jpg`;
  const storagePath = `${userId}/${reportId}/${safeFilename}`;

  return {
    jpegBuffer,
    sha256Hash,
    storagePath,
    width: info.width,
    height: info.height,
    sizeBytes: jpegBuffer.length,
    hadExifMetadata,
  };
}