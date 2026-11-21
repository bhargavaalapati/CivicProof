"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-amber-700 mx-auto" />
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-slate-600">
          Your saved reports and uploaded photos remain safely stored. You can retry loading this view or return home.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}