// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CivicProof — Independent Civic Complaint Evidence Workspace",
    template: "%s | CivicProof",
  },
  description:
    "A municipal 'resolved' status is not verified resolution. Compare before-and-after pothole and garbage photos in GVMC Ward 18 with cautious multimodal AI and export factual follow-up packets.",
  applicationName: "CivicProof",
  keywords: [
    "CivicProof",
    "civic tech",
    "digital governance",
    "complaint verification",
    "GVMC Ward 18",
    "MVP Colony Visakhapatnam",
    "multimodal AI",
    "Gemini Decisions API",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "CivicProof",
    title: "CivicProof — A 'Resolved' Ticket Is Not Verified Resolution",
    description:
      "Organize before-and-after civic complaint photos, inspect provisional AI observations and limitations, record your citizen decision, and export a factual PDF packet.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicProof — Civic Complaint Evidence & Resolution Workspace",
    description:
      "The citizen trust layer between 'complaint closed' and 'problem fixed' for GVMC Ward 18, Visakhapatnam.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const WEB_APP_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CivicProof",
  url: SITE_URL,
  applicationCategory: "CivicTechApplication",
  operatingSystem: "Web",
  description:
    "An independent citizen evidence workspace for comparing before-and-after civic complaint photographs, surfacing visual uncertainty, recording citizen review decisions, and exporting factual follow-up packets.",
  areaServed: {
    "@type": "Place",
    name: "GVMC Ward 18 – MVP Colony, Visakhapatnam",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-[#FAF9F6] text-slate-900 antialiased selection:bg-blue-200 selection:text-slate-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEB_APP_JSON_LD) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-slate-900 focus:text-white focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}