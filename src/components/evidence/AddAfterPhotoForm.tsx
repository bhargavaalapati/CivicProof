"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

export function AddAfterPhotoForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [markExternalResolved, setMarkExternalResolved] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Select an After / closure photo first.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("phase", "after");
      fd.append("photo", file);
      fd.append("mark_external_resolved", String(markExternalResolved));

      const res = await fetch(`/api/reports/${reportId}/evidence`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload After photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3">
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
          {error}
        </div>
      )}
      <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 cursor-pointer hover:bg-slate-100">
        <UploadCloud className="w-6 h-6 text-slate-500 mb-1" />
        <span className="text-sm font-medium text-slate-700">
          {file ? file.name : "Upload Closure / After Photo"}
        </span>
        <span className="text-xs text-slate-500">Max 5 MB • EXIF/GPS stripped on server</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={markExternalResolved}
          onChange={(e) => setMarkExternalResolved(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span>External municipal portal marked this complaint &ldquo;Resolved&rdquo;</span>
      </label>

      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full min-h-[44px] rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {uploading ? "Sanitizing & Saving..." : "Attach After Photo"}
      </button>
    </form>
  );
}