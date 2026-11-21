// src/app/demo/page.tsx
import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { InteractiveDemoWorkspace } from "@/components/demo/InteractiveDemoWorkspace";

export const metadata: Metadata = {
  title: "Interactive Evaluation Demo",
  description:
    "One-click synthetic demo of CivicProof's 3 GVMC Ward 18 evaluation scenarios: apparent improvement, mismatched closure scene, and controlled abstention.",
  alternates: {
    canonical: "/demo",
  },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col">
      <LandingNav />
      <main id="main-content" className="max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 flex-1">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Interactive Demo Sandbox" }]}
          backHref="/"
        />
        <InteractiveDemoWorkspace />
      </main>
      <LandingFooter />
    </div>
  );
}