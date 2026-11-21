// src/components/ui/WorkspaceNav.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LiquidCivicLogo } from "@/components/landing/LiquidCivicLogo";
import { useToast } from "@/components/ui/ToastProvider";
import { Home, LogOut, Plus, User } from "lucide-react";

export function WorkspaceNav() {
  const router = useRouter();
  const toast = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserEmail(data.user?.email ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.info("Signed out", "You have been signed out of CivicProof.");
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 liquid-glass-nav">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="min-h-[44px] inline-flex items-center">
            <LiquidCivicLogo compact />
          </Link>
          <span className="hidden sm:inline-block text-xs text-slate-300">|</span>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-950"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {userEmail && (
            <span
              title={userEmail}
              className="hidden md:inline-flex items-center gap-1.5 max-w-[165px] px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700"
            >
              <User className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
              <span className="truncate">{userEmail}</span>
            </span>
          )}
          <Link
            href="/reports/new"
            className="inline-flex items-center gap-1.5 min-h-[42px] px-4 rounded-lg bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Report
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
        </div>
      </div>
    </header>
  );
}