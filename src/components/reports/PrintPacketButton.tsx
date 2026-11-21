"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

export function PrintPacketButton({ reportId }: { reportId: string }) {
  const [exporting, setExporting] = useState(false);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function handleExportAndPrint() {
    setExporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/exports`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record export snapshot.");
      setSnapshotId(data.snapshot?.id ?? null);
      // Allow DOM to render the recorded snapshot ID before invoking Print -> Save as PDF
      setTimeout(() => window.print(), 150);
      toast.success("Export snapshot recorded", "Your export snapshot has been logged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
      toast.error("Failed to record export snapshot", err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="print:hidden flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleExportAndPrint}
        disabled={exporting}
        className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
      >
        <Printer className="w-4 h-4" />
        {exporting ? "Recording Snapshot..." : "Save Snapshot & Print / Save as PDF"}
      </button>
      {snapshotId && (
        <span className="text-xs font-mono text-slate-600">
          Snapshot logged: {snapshotId.slice(0, 8)}
        </span>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}