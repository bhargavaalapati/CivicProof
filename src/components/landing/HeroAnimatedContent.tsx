// src/components/landing/HeroAnimatedContent.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight, MapPin } from "lucide-react";

export function HeroAnimatedContent() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !heroRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".hero-stagger", {
        y: 26,
        opacity: 0,
        duration: 0.72,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });

      gsap.from(".hero-card", {
        y: 36,
        opacity: 0,
        scale: 0.97,
        duration: 0.85,
        delay: 0.2,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });

      gsap.to(".hero-card-float", {
        y: -6,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
      <div className="lg:col-span-7 space-y-6">
        <div className="hero-stagger inline-flex flex-wrap items-center gap-2 rounded-full bg-white/90 border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs">
          <MapPin className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
          <span>GVMC Ward 18 – MVP Colony, Visakhapatnam</span>
          <span className="text-slate-300">•</span>
          <span>Potholes &amp; Garbage</span>
        </div>

        <h1 className="hero-stagger font-serif text-4xl sm:text-6xl leading-[1.06] tracking-tight text-slate-950">
          A &ldquo;resolved&rdquo; ticket is not{" "}
          <span className="italic text-blue-800">verified resolution.</span>
        </h1>

        <p className="hero-stagger text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl">
          CivicProof is the citizen evidence workspace between <strong>complaint closed</strong> and{" "}
          <strong>problem actually fixed</strong>. Compare before-and-after photos with cautious multimodal AI,
          inspect limitations, and export a factual follow-up packet.
        </p>

        <div className="hero-stagger flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/reports"
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 shadow-sm transition-colors"
          >
            Open Evidence Workspace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl bg-white/90 border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-white transition-colors"
          >
            Try 1-Click Demo
          </Link>
        </div>

        <p className="hero-stagger text-xs text-slate-600">
          Created for IdeaForge. Independent prototype — does not auto-submit to municipal portals or claim government affiliation.
        </p>
      </div>

      {/* Hero Right: Animated Liquid-Glass Evidence Preview Card */}
      <div className="lg:col-span-5 hero-card">
        <div className="hero-card-float liquid-glass-card rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-mono font-semibold text-slate-600">PROVISIONAL REVIEW PREVIEW</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" aria-hidden="true" />
              Human Review Required
            </span>
          </div>

          <div className="relative grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-100 border border-slate-200 p-3">
              <span className="font-semibold text-slate-800 block mb-1">Before Photo</span>
              <p className="text-slate-600 leading-snug">
                Damaged road edge beside Drainage Grate #7 on Double Road.
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 border border-slate-200 p-3">
              <span className="font-semibold text-slate-800 block mb-1">After Photo</span>
              <p className="text-slate-600 leading-snug">
                Dark close-up of center asphalt; original edge outside frame.
              </p>
            </div>
          </div>

          <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
            <div className="h-full w-1/3 rounded-full bg-blue-600/80 evidence-scan-bar" />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-900">
              Provisional AI Assessment: Uncertain
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              <strong>What this does not establish:</strong> Whether the originally reported road edge was
              repaired. Recommended next step: request clearer matched-angle photo.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-semibold text-center">
            <div className="rounded-lg bg-slate-100 border border-slate-200 py-2 px-1 text-slate-700">
              External: Closed
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 py-2 px-1 text-blue-900">
              AI: Uncertain
            </div>
            <div className="rounded-lg bg-slate-900 py-2 px-1 text-white">
              Citizen Decides
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}