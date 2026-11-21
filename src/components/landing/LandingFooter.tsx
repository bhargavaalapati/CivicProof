"use client";

import Link from "next/link";
import { ArrowUp, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="max-w-5xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-12">
        {/* Brand & About */}
        <div className="md:col-span-6 space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-slate-950">
            <ShieldCheck className="w-5 h-5 text-blue-700" aria-hidden="true" />
            CivicProof
          </Link>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            An independent citizen evidence workspace that helps residents compare before-and-after civic
            complaint photos, surface visual uncertainty, and prepare factual follow-up packets.
          </p>
          <p className="text-xs font-medium text-slate-500">
            Created for IdeaForge • Focused Pilot: GVMC Ward 18 – MVP Colony, Visakhapatnam.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="md:col-span-3 space-y-2.5 text-sm">
          <h2 className="font-semibold text-slate-950 text-xs uppercase tracking-wider">Quick Links</h2>
          <ul className="space-y-2 text-slate-600">
            <li>
              <a href="#story" className="hover:text-slate-950 transition-colors">
                Why Closed ≠ Verified
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-slate-950 transition-colors">
                How It Works
              </a>
            </li>
            <li>
              <a href="#demo-cases" className="hover:text-slate-950 transition-colors">
                Evaluation Cases
              </a>
            </li>
            <li>
              <a href="#privacy" className="hover:text-slate-950 transition-colors">
                Privacy &amp; Boundaries
              </a>
            </li>
          </ul>
        </div>

        {/* Workspace & Back to Top */}
        <div className="md:col-span-3 space-y-2.5 text-sm">
          <h2 className="font-semibold text-slate-950 text-xs uppercase tracking-wider">Workspace</h2>
          <ul className="space-y-2 text-slate-600">
            <li><Link className="hover:text-slate-950 transition-colors" href="/demo">Interactive Demo</Link></li>
            <li>
              <Link href="/reports" className="hover:text-slate-950 transition-colors">
                My Reports
              </Link>
            </li>
            <li>
              <Link href="/reports/new" className="hover:text-slate-950 transition-colors">
                Create a Report
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-slate-950 transition-colors">
                Sign In
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-slate-950 transition-colors">
                Create Account
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar with Back to Top */}
      <div className="border-t border-slate-100 bg-[#FAF9F6]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>Created for IdeaForge • Independent prototype — not affiliated with GVMC.</span>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition-colors"
          >
            Back to top <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}