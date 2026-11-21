import dynamic from "next/dynamic";
import Link from "next/link";
import { SmoothScrollProvider } from "@/components/landing/SmoothScrollProvider";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroAnimatedContent } from "@/components/landing/HeroAnimatedContent";
import { ScrollStorySection } from "@/components/landing/ScrollStorySection";
import { MicroReveal } from "@/components/landing/MicroReveal";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  ArrowRight,
  CheckCircle2,
  EyeOff,
  FileText,
  Lock,
  MapPin,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";

const HeroShaderCanvas = dynamic(
  () => import("@/components/landing/HeroShaderCanvas").then((m) => m.HeroShaderCanvas),
  { ssr: true }
);

const DEMO_CASES = [
  {
    id: "case-1",
    tag: "SYNTHETIC DEMO 1 • POTHOLE",
    title: "Apparent Visual Improvement",
    location: "Sector 4 Junction, Blue Pole #14",
    comparability: "Likely same location",
    change: "Apparent improvement (provisional)",
    tone: "bg-blue-50 border-blue-200 text-blue-950",
    summary:
      "Matching curb marker and electric pole confirm comparability. AI marks provisional improvement and prompts the citizen to confirm based on their own inspection.",
  },
  {
    id: "case-2",
    tag: "SYNTHETIC DEMO 2 • GARBAGE",
    title: "Mismatched Closure Location",
    location: "Rythu Bazaar Corner, Sector 2",
    comparability: "Likely different location",
    change: "Insufficient evidence",
    tone: "bg-amber-50 border-amber-300 text-amber-950",
    summary:
      "Closure photo shows a tree-lined park walkway instead of the red brick compound wall. Code invariants block 'improved' and flag the mismatch for citizen dispute.",
  },
  {
    id: "case-3",
    tag: "SYNTHETIC DEMO 3 • POTHOLE",
    title: "Ambiguous Angle — Controlled Abstention",
    location: "MVP Double Road, Drainage Grate #7",
    comparability: "Uncertain — needs clearer photo",
    change: "Insufficient evidence",
    tone: "bg-amber-50 border-amber-300 text-amber-950",
    summary:
      "After photo is a dark close-up cutting off the damaged road edge. Instead of guessing, CivicProof explicitly abstains and recommends requesting a clearer photo.",
  },
];

const PRIVACY_PROMISES = [
  {
    icon: Lock,
    title: "Strict Row-Level Security (RLS)",
    text: "Your reports and original photos stay in private Supabase storage scoped to your authenticated user ID. No cross-user access.",
  },
  {
    icon: EyeOff,
    title: "EXIF/GPS Stripped & PII Shielded",
    text: "Every upload is signature-checked, re-encoded to clean JPEG, and screened by Stage-1 Gemini Decisions to keep faces or plates out of public views.",
  },
  {
    icon: ShieldAlert,
    title: "Zero Sensitive IDs Collected",
    text: "CivicProof collects no Aadhaar numbers, no phone numbers, and no precise residential addresses on public summaries.",
  },
  {
    icon: FileText,
    title: "Honest Epistemic Boundaries",
    text: "Independent prototype — not affiliated with GVMC. AI assessments are provisional, never auto-close complaints, and make no legal claims.",
  },
];

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col text-slate-900">
        <LandingNav />

        <main id="main-content" className="flex-1">
          {/* SINGLE CLEAN HERO SECTION */}
          <section className="relative isolate pt-14 pb-20 sm:pt-20 sm:pb-28 px-4 overflow-hidden">
            <HeroShaderCanvas />
            <HeroAnimatedContent />
          </section>

          {/* GSAP SCROLL STORYTELLING */}
          <ScrollStorySection />

          {/* HOW IT WORKS IN 3 STEPS */}
          <section id="how-it-works" aria-labelledby="how-heading" className="py-16 sm:py-24 px-4">
            <div className="max-w-5xl mx-auto">
              <MicroReveal className="max-w-2xl mb-12">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
                  Deterministic Workflow + Cautious Vision AI
                </p>
                <h2 id="how-heading" className="font-serif text-3xl sm:text-4xl text-slate-950 mb-3">
                  How CivicProof works in 3 clear steps
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Deterministic code enforces permissions, ward bounds, and state transitions. Vision models assist
                  only with structured visual comparison.
                </p>
              </MicroReveal>

              <div className="grid md:grid-cols-3 gap-6">
                <MicroReveal className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-blue-800" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-slate-950">1. Capture &amp; Sanitize Evidence</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Pin the spot inside Ward 18, upload a Before photo, and later attach the closure photo. Magic-byte
                    checks, 5 MB bounds, and EXIF/GPS stripping happen automatically on the server.
                  </p>
                </MicroReveal>

                <MicroReveal className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-800" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-slate-950">2. Two-Stage Provisional AI Triage</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Stage 1 (Gemini Decisions) scores scene comparability and PII flags in one pass. Stage 2 (Gemini
                    2.5 Flash) writes observations &amp; limitations locked by Zod safety invariants.
                  </p>
                </MicroReveal>

                <MicroReveal className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-800" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-slate-950">3. Citizen Decision &amp; PDF Packet</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    You confirm, dispute (with a factual note), or request a clearer photo. Export a timestamped PDF
                    Follow-Up Packet or share a privacy-safe public summary link.
                  </p>
                </MicroReveal>
              </div>
            </div>
          </section>

          {/* 3 SYNTHETIC DEMO CASES */}
          <section
            id="demo-cases"
            aria-labelledby="demo-heading"
            className="py-16 sm:py-24 px-4 bg-white border-y border-slate-200/80"
          >
            <div className="max-w-5xl mx-auto">
              <MicroReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-2">
                    Controlled Failure Handling — Not Just a Happy Path
                  </p>
                  <h2 id="demo-heading" className="font-serif text-3xl sm:text-4xl text-slate-950 mb-2">
                    Explore the 3 Synthetic Evaluation Scenarios
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600">
                    Open the Quick Guide inside your workspace to load all three clearly labelled synthetic Ward 18
                    cases—including our signature ambiguous abstention case.
                  </p>
                </div>
                <Link
                  href="/reports"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800 shrink-0"
                >
                  Open Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </MicroReveal>

              <div className="grid md:grid-cols-3 gap-5">
                {DEMO_CASES.map((item) => (
                  <MicroReveal
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-[#FAF9F6] p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded bg-amber-100 text-amber-950">
                        {item.tag}
                      </span>
                      <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {item.location}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{item.summary}</p>
                    </div>

                    <div className={`rounded-xl border p-3 text-xs space-y-1 ${item.tone}`}>
                      <div>
                        <strong>Comparability:</strong> {item.comparability}
                      </div>
                      <div>
                        <strong>Visible Change:</strong> {item.change}
                      </div>
                    </div>
                  </MicroReveal>
                ))}
              </div>
            </div>
          </section>

          {/* PRIVACY & SECURITY PROMISES */}
          <section id="privacy" aria-labelledby="privacy-heading" className="py-16 sm:py-24 px-4">
            <div className="max-w-5xl mx-auto">
              <MicroReveal className="max-w-2xl mb-12">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
                  Privacy-First Architecture
                </p>
                <h2 id="privacy-heading" className="font-serif text-3xl sm:text-4xl text-slate-950 mb-3">
                  Built with explicit security and trust boundaries
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Prompt instructions are never treated as a security boundary. Authorization, media validation, and
                  schema checks are enforced in server-side code and Postgres RLS.
                </p>
              </MicroReveal>

              <div className="grid sm:grid-cols-2 gap-5">
                {PRIVACY_PROMISES.map((p) => {
                  const Icon = p.icon;
                  return (
                    <MicroReveal
                      key={p.title}
                      className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-slate-800" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-950 mb-1">{p.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{p.text}</p>
                      </div>
                    </MicroReveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* FINAL CTA BANNER */}
          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto rounded-3xl bg-slate-950 text-white p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl space-y-2">
                <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">
                  Organize evidence, surface uncertainty, and keep resolution honest.
                </h2>
                <p className="text-sm sm:text-base text-slate-300">
                  Start documenting your Ward 18 civic issue or test the 3 synthetic scenarios inside your workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href="/reports"
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
                >
                  Open Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
    </SmoothScrollProvider>
  );
}