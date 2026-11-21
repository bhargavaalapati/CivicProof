import { z } from "zod";
import { CONFIGURED_LOCALITY, ExternalStatusSchema, IssueCategorySchema } from "./contracts";

export function isWithinWard18(lat: number, lng: number): boolean {
  const { minLat, maxLat, minLng, maxLng } = CONFIGURED_LOCALITY.bounds;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

export const CreateReportInputSchema = z.object({
  category: IssueCategorySchema,
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(140),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  lat: z.coerce
    .number()
    .refine(
      (v) => v >= CONFIGURED_LOCALITY.bounds.minLat && v <= CONFIGURED_LOCALITY.bounds.maxLat,
      `Latitude must be within ${CONFIGURED_LOCALITY.name} (${CONFIGURED_LOCALITY.bounds.minLat}–${CONFIGURED_LOCALITY.bounds.maxLat})`
    ),
  lng: z.coerce
    .number()
    .refine(
      (v) => v >= CONFIGURED_LOCALITY.bounds.minLng && v <= CONFIGURED_LOCALITY.bounds.maxLng,
      `Longitude must be within ${CONFIGURED_LOCALITY.name} (${CONFIGURED_LOCALITY.bounds.minLng}–${CONFIGURED_LOCALITY.bounds.maxLng})`
    ),
  landmark: z.string().trim().max(120).optional().default(""),
  external_ref_id: z.string().trim().max(60).optional().default(""),
  external_status: ExternalStatusSchema.optional().default("unknown"),
  ai_consent_acknowledged: z
    .boolean()
    .refine((v) => v === true, "Please acknowledge the AI processing notice before uploading."),
});

export type CreateReportInput = z.infer<typeof CreateReportInputSchema>;