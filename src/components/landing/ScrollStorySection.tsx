"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera, FileWarning, Scale } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const STORY_CHAPTERS = [
  {
    step: "01",
    badge: "Complaint Filed",
    badgeTone: "bg-slate-100 text-slate-800 border-slate-200",
    title: "A resident reports a damaged road or overflowing dump.",
    body: "You capture the original pothole or garbage pile beside a fixed street landmark in GVMC Ward 18. CivicProof validates the image signature, strips EXIF/GPS metadata, and timestamps a SHA-256 hash.",
    statusLabel: "External Portal: Submitted",
    icon: Camera,
  },
  {
    step: "02",
    badge: "Marked “Resolved”",
    badgeTone: "bg-amber-100 text-amber-950 border-amber-300",
    title: "The ticket closes — with a mismatched or unclear photo.",
    body: "A closure photo arrives from a different street corner, shot in poor lighting, or cropped so the original damaged edge is outside the frame. Traditional portals treat the ticket as finished.",
    statusLabel: "External Portal: Marked Resolved ≠ Verified",
    icon: FileWarning,
  },
  {
    step: "03",
    badge: "Evidence Audited",
    badgeTone: "bg-blue-100 text-blue-950 border-blue-300",
    title: "Provisional AI flags uncertainty. You hold the final decision.",
    body: "Gemini Decisions + Gemini 2.5 Flash check scene comparability first. If the scene does not match, the system refuses to call it fixed—empowering you to dispute and export a factual Evidence Packet.",
    statusLabel: "Citizen Review: Disputed + Packet Ready",
    icon: Scale,
  },
];

export function ScrollStorySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".story-heading-anim", {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          once: true,
        },
      });

      gsap.from(".story-card", {
        y: 44,
        opacity: 0,
        scale: 0.97,
        duration: 0.75,
        stagger: 0.18,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: {
          trigger: ".story-grid",
          start: "top 82%",
          once: true,
        },
      });

      gsap.fromTo(
        ".story-progress-fill",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            end: "bottom 60%",
            scrub: 0.4,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="story"
      aria-labelledby="story-heading"
      className="py-16 sm:py-24 px-4 border-y border-slate-200/80 bg-white"
    >
      <div className="max-w-5xl mx-auto">
        <div className="story-heading-anim max-w-2xl mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">
            The Missing Trust Layer
          </p>
          <h2 id="story-heading" className="font-serif text-3xl sm:text-5xl tracking-tight text-slate-950 mb-4">
            Complaint closed <span className="text-slate-400">→</span> but is it actually fixed?
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Existing reporting apps help file tickets, and many work well. The gap appears when a complaint is marked
            &ldquo;resolved&rdquo; without comparable before-and-after proof.
          </p>
        </div>

        {/* Scrubbed Scroll Progress Line */}
        <div className="hidden md:block h-1 w-full rounded-full bg-slate-100 mb-8 overflow-hidden" aria-hidden="true">
          <div className="story-progress-fill h-full w-full origin-left bg-gradient-to-r from-slate-700 via-amber-500 to-blue-700" />
        </div>

        <div className="story-grid grid md:grid-cols-3 gap-5">
          {STORY_CHAPTERS.map((ch) => {
            const Icon = ch.icon;
            return (
              <article
                key={ch.step}
                className="story-card rounded-2xl border border-slate-200 bg-[#FAF9F6] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-slate-500">STEP {ch.step}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ch.badgeTone}`}>
                      {ch.badge}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-slate-800" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 mb-2">{ch.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{ch.body}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/80 text-xs font-mono text-slate-700">
                  {ch.statusLabel}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}