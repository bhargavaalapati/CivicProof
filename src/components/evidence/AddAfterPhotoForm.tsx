"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EvidencePhotoDropzone } from "./EvidencePhotoDropzone";
import { useToast } from "@/components/ui/ToastProvider";

export function AddAfterPhotoForm({
  reportId,
  phase = "after",
}: {
  reportId: string;
  phase?: "before" | "after";
}) {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [markExternalResolved, setMarkExternalResolved] = useState(phase === "after");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(`Select or capture a ${phase.toUpperCase()} photo first.`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("phase", phase);
      fd.append("photo", file);
      if (phase === "after") {
        fd.append("mark_external_resolved", String(markExternalResolved));
      }

      const res = await fetch(`/api/reports/${reportId}/evidence`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFile(null);
      if (Array.isArray(data.intakeWarnings) && data.intakeWarnings.length > 0) {
        toast.warning("Photo attached with note", data.intakeWarnings[0]);
      } else {
        toast.success(
          `${phase === "before" ? "Before" : "After"} photo saved`,
          "Verified outdoor civic scene and stripped EXIF/GPS metadata."
        );
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not upload photo.";
      setError(msg);
      toast.error("Photo rejected", msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3">
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      <EvidencePhotoDropzone
        id={`evidence-${phase}-${reportId}`}
        label={
          phase === "before"
            ? "Upload Replacement Before Photo"
            : "Upload Closure / After Photo"
        }
        file={file}
        onFileChange={setFile}
        disabled={uploading}
      />

      {phase === "after" && (
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={markExternalResolved}
            onChange={(e) => setMarkExternalResolved(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span>External municipal portal marked this complaint &ldquo;Resolved&rdquo;</span>
        </label>
      )}

      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full min-h-[44px] rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {uploading
          ? "Screening & Sanitizing Photo..."
          : phase === "before"
          ? "Attach Replacement Before Photo"
          : "Attach After Photo"}
      </button>
    </form>
  );
}