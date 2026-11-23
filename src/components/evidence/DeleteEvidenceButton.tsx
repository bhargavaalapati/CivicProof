// src/components/evidence/DeleteEvidenceButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { Trash2 } from "lucide-react";

export function DeleteEvidenceButton({
  reportId,
  evidenceId,
  phase,
}: {
  reportId: string;
  evidenceId: string;
  phase: "before" | "after";
}) {
  const router = useRouter();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Remove this ${phase.toUpperCase()} photo so you can upload a replacement?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/evidence/${evidenceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove photo.");
      toast.info("Photo removed", `You can now upload a new ${phase.toUpperCase()} photograph.`);
      router.refresh();
    } catch (err) {
      toast.error("Delete failed", err instanceof Error ? err.message : "Could not remove photo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {deleting ? "Removing..." : "Delete & Re-upload"}
    </button>
  );
}