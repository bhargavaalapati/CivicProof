// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const alt = "CivicProof — A Resolved Ticket Is Not Verified Resolution";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(135deg, #FAF9F6 0%, #EEF4FD 60%, #FDF6E9 100%)",
          color: "#0F172A",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#1D4ED8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FAF9F6",
              fontSize: "22px",
              fontWeight: 800,
            }}
          >
            CP
          </div>
          <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            CivicProof
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "18px",
              fontWeight: 600,
              color: "#1E3A8A",
              background: "#DBEAFE",
              padding: "8px 18px",
              borderRadius: "999px",
            }}
          >
            GVMC Ward 18 • MVP Colony
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "960px" }}>
          <div style={{ fontSize: "62px", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            A &ldquo;resolved&rdquo; ticket is not verified resolution.
          </div>
          <div style={{ fontSize: "26px", color: "#334155", lineHeight: 1.4 }}>
            Compare before/after civic photos with cautious multimodal AI, surface uncertainty,
            and keep final verification in the citizen&apos;s hands.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #E2E8F0",
            paddingTop: "24px",
            fontSize: "18px",
            color: "#475569",
          }}
        >
          <span>Gemini Decisions + Gemini 2.5 Flash • Supabase RLS • EXIF Stripping</span>
          <span style={{ fontWeight: 700, color: "#0F172A" }}>Created for IdeaForge</span>
        </div>
      </div>
    ),
    { ...size }
  );
}