import Link from "next/link";
import { FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
        <FileSearch className="w-8 h-8 text-slate-500 mx-auto" />
        <h1 className="text-xl font-bold">Record not found or private</h1>
        <p className="text-sm text-slate-600">
          This civic report does not exist, or it is private to its owner under Row-Level Security.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/reports"
            className="inline-flex items-center min-h-[44px] px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Open my workspace
          </Link>
          <Link
            href="/"
            className="inline-flex items-center min-h-[44px] px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}