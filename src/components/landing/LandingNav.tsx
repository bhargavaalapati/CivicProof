// src/components/landing/LandingNav.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LiquidCivicLogo } from "./LiquidCivicLogo";
import { useToast } from "@/components/ui/ToastProvider";
import { ArrowRight, LogOut, User } from "lucide-react";

export function LandingNav() {
  const router = useRouter();
  const toast = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.user?.email ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    toast.info("Signed out", "Your CivicProof session has ended.");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 liquid-glass-nav">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="min-h-[44px] inline-flex items-center">
          <LiquidCivicLogo compact />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700"
        >
          <a href="#story" className="hover:text-slate-950 py-2">
            Why It Matters
          </a>
          <a href="#how-it-works" className="hover:text-slate-950 py-2">
            How It Works
          </a>
          <a href="#demo-cases" className="hover:text-slate-950 py-2">
            Demo Cases
          </a>
          <a href="#privacy" className="hover:text-slate-950 py-2">
            Privacy
          </a>
          <Link className="hover:text-slate-950 py-2 font-semibold text-blue-800" href="/demo">Interactive Demo</Link>
        </nav>

        <div className="flex items-center gap-2">
          {!authReady ? (
            <div className="h-10 w-36 rounded-lg bg-slate-200/70 animate-pulse" />
          ) : userEmail ? (
            <>
              <span
                title={userEmail}
                className="hidden sm:inline-flex items-center gap-1.5 max-w-[170px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700"
              >
                <User className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                <span className="truncate">{userEmail}</span>
              </span>
              <Link
                href="/reports"
                className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 rounded-lg bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                My Reports <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex items-center justify-center min-h-[42px] min-w-[42px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-slate-700" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center min-h-[42px] px-3.5 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-900/5"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 rounded-lg bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}