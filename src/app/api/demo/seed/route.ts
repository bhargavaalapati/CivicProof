import { NextResponse } from "next/server";
import sharp from "sharp";
import { createServerSupabase } from "@/lib/supabase/server";
import { sanitizeAndPrepareEvidence } from "@/lib/security/media";

async function renderSyntheticSceneJpeg(svgMarkup: string): Promise<Buffer> {
  return sharp(Buffer.from(svgMarkup))
    .resize(960, 640)
    .jpeg({ quality: 85 })
    .toBuffer();
}

const SYNTHETIC_CASES = [
  {
    title: "[SYNTHETIC DEMO 1] Deep pothole near MVP Sector 4 Junction",
    category: "pothole" as const,
    description:
      "SYNTHETIC CASE (Improved): Wide bitumen pothole right beside the blue electric pole and yellow curb marker on Sector 4 Main Road. Municipal portal marked resolved after patching.",
    lat: 17.7421,
    lng: 83.3362,
    landmark: "MVP Sector 4 Main Rd, Blue Electric Pole #14",
    external_ref_id: "DEMO-GVMC-2026-101",
    beforeSvg: `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="960" height="220" fill="#dbeafe"/>
      <rect y="220" width="960" height="420" fill="#475569"/>
      <rect x="0" y="210" width="960" height="22" fill="#facc15"/>
      <rect x="760" y="40" width="28" height="200" fill="#1d4ed8"/>
      <ellipse cx="430" cy="430" rx="185" ry="75" fill="#1e293b" stroke="#0f172a" stroke-width="10"/>
      <ellipse cx="430" cy="438" rx="135" ry="42" fill="#334155"/>
      <text x="32" y="54" font-family="sans-serif" font-size="24" font-weight="bold" fill="#0f172a">SYNTHETIC BEFORE — Sector 4 Blue Pole #14 (Pothole Present)</text>
    </svg>`,
    afterSvg: `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="960" height="220" fill="#dbeafe"/>
      <rect y="220" width="960" height="420" fill="#475569"/>
      <rect x="0" y="210" width="960" height="22" fill="#facc15"/>
      <rect x="760" y="40" width="28" height="200" fill="#1d4ed8"/>
      <ellipse cx="430" cy="430" rx="190" ry="78" fill="#64748b" stroke="#94a3b8" stroke-width="4"/>
      <text x="32" y="54" font-family="sans-serif" font-size="24" font-weight="bold" fill="#0f172a">SYNTHETIC AFTER — Same Blue Pole #14 (Fresh Asphalt Patch)</text>
    </svg>`,
  },
  {
    title: "[SYNTHETIC DEMO 2] Overflowing garbage dump near Rythu Bazaar Corner",
    category: "garbage" as const,
    description:
      "SYNTHETIC CASE (Different Scene): Large mound of mixed household waste next to the red brick compound wall. Closure photo appears to show a completely different tree-lined park lane.",
    lat: 17.7385,
    lng: 83.3318,
    landmark: "Red Brick Compound Wall, MVP Sector 2",
    external_ref_id: "DEMO-GVMC-2026-204",
    beforeSvg: `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="960" height="320" fill="#b91c1c"/>
      <rect y="320" width="960" height="320" fill="#64748b"/>
      <circle cx="380" cy="420" r="85" fill="#78350f"/>
      <circle cx="480" cy="440" r="95" fill="#a16207"/>
      <circle cx="560" cy="450" r="65" fill="#3f6212"/>
      <rect x="340" y="445" width="75" height="45" fill="#f8fafc"/>
      <text x="32" y="54" font-family="sans-serif" font-size="24" font-weight="bold" fill="#ffffff">SYNTHETIC BEFORE — Red Brick Wall (Garbage Pile)</text>
    </svg>`,
    afterSvg: `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="960" height="260" fill="#e0f2fe"/>
      <rect y="260" width="960" height="140" fill="#15803d"/>
      <rect y="400" width="960" height="240" fill="#cbd5e1"/>
      <circle cx="220" cy="210" r="75" fill="#166534"/>
      <circle cx="720" cy="200" r="85" fill="#166534"/>
      <text x="32" y="54" font-family="sans-serif" font-size="24" font-weight="bold" fill="#0f172a">SYNTHETIC AFTER — Different Location (Green Park Walk)</text>
    </svg>`,
  },
  {
    title: "[SYNTHETIC DEMO 3] Broken road edge pothole near MVP Double Road",
    category: "pothole" as const,
    description:
      "SYNTHETIC CASE (Ambiguous): Damaged shoulder edge along the white drainage grate. Follow-up photo is a tight close-up of center asphalt from a different angle with the damaged edge out of frame.",
    lat: 17.7464,
    lng: 83.3412,
    landmark: "MVP Double Road, Drainage Grate #7",
    external_ref_id: "DEMO-GVMC-2026-309",
    beforeSvg: `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="960" height="200" fill="#e2e8f0"/>
      <rect y="200" width="960" height="440" fill="#475569"/>
      <rect x="40" y="210" width="180" height="45" fill="#cbd5e1" stroke="#334155" stroke-width="4"/>
      <polygon points="40,265 250,265 210,410 40,390" fill="#0f172a"/>
      <text x="32" y="54" font-family="sans-serif" font-size="24" font-weight="bold" fill="#0f172a">SYNTHETIC BEFORE — Left Road Edge + Drainage Grate #7</text>
    </svg>`,
    afterSvg: `<svg width="960" height="640" xmlns="http://www.w3.org/2000/svg">
      <rect width="960" height="640" fill="#334155"/>
      <line x1="0" y1="320" x2="960" y2="320" stroke="#f8fafc" stroke-width="10" stroke-dasharray="45 35"/>
      <rect width="960" height="640" fill="rgba(15,23,42,0.35)"/>
      <text x="32" y="54" font-family="sans-serif" font-size="24" font-weight="bold" fill="#f8fafc">SYNTHETIC AFTER — Dark Close-Up (Road Edge Out of Frame)</text>
    </svg>`,
  },
];

export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent duplicate demo seeding for the same user
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_synthetic_demo", true);

  if (existing && existing.length >= 3) {
    return NextResponse.json({
      message: "3 synthetic demo cases already exist in your workspace.",
      seededCount: 0,
    });
  }

  let seededCount = 0;

  for (const item of SYNTHETIC_CASES) {
    const { data: report, error: reportErr } = await supabase
      .from("reports")
      .insert({
        owner_id: user.id,
        category: item.category,
        title: item.title,
        description: item.description,
        lat: item.lat,
        lng: item.lng,
        landmark: item.landmark,
        external_ref_id: item.external_ref_id,
        external_status: "marked_resolved",
        citizen_review: "not_reviewed",
        assessment_status: "pending",
        is_synthetic_demo: true,
        ai_consent_acknowledged: true,
      })
      .select()
      .single();

    if (reportErr || !report) continue;

    for (const [phase, svg] of [
      ["before", item.beforeSvg],
      ["after", item.afterSvg],
    ] as const) {
      const rawBuf = await renderSyntheticSceneJpeg(svg);
      const sanitized = await sanitizeAndPrepareEvidence({
        rawBuffer: rawBuf,
        userId: user.id,
        reportId: report.id,
        phase,
      });

      await supabase.storage
        .from("civic-evidence")
        .upload(sanitized.storagePath, sanitized.jpegBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      await supabase.from("evidence").insert({
        report_id: report.id,
        owner_id: user.id,
        phase,
        storage_path: sanitized.storagePath,
        sha256_hash: sanitized.sha256Hash,
        mime_type: "image/jpeg",
        file_size_bytes: sanitized.sizeBytes,
        width: sanitized.width,
        height: sanitized.height,
      });
    }

    await supabase.from("report_events").insert([
      {
        report_id: report.id,
        owner_id: user.id,
        event_type: "report_created",
        summary: "Synthetic demo report seeded with sanitized Before photo.",
      },
      {
        report_id: report.id,
        owner_id: user.id,
        event_type: "after_evidence_attached",
        summary: "Municipal portal marked complaint RESOLVED and attached After photo (awaiting citizen review).",
      },
    ]);

    seededCount++;
  }

  return NextResponse.json({ message: `Seeded ${seededCount} synthetic demo cases.`, seededCount });
}