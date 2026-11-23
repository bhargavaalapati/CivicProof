// src/components/evidence/EvidencePhotoDropzone.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Trash2, UploadCloud } from "lucide-react";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_CLIENT_BYTES = 5 * 1024 * 1024;

interface EvidencePhotoDropzoneProps {
  id: string;
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function EvidencePhotoDropzone({
  id,
  label,
  file,
  onFileChange,
  disabled = false,
}: EvidencePhotoDropzoneProps) {
  const browseInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      const clearTimer = window.setTimeout(() => setPreviewUrl(null), 0);
      return () => window.clearTimeout(clearTimer);
    }
    const url = URL.createObjectURL(file);
    const setTimer = window.setTimeout(() => setPreviewUrl(url), 0);
    return () => {
      window.clearTimeout(setTimer);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function validateAndSelect(candidate: File | null) {
    setLocalError(null);
    if (!candidate) {
      onFileChange(null);
      return;
    }
    if (candidate.size > MAX_CLIENT_BYTES) {
      setLocalError("Image exceeds the 5 MB limit. Please choose a smaller photo.");
      return;
    }
    // Allow empty type on some mobile cameras (server checks real magic bytes regardless)
    if (candidate.type && !ALLOWED_TYPES.has(candidate.type)) {
      setLocalError("Only JPEG, PNG, or WebP images are supported.");
      return;
    }
    onFileChange(candidate);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0] ?? null;
    validateAndSelect(dropped);
  }

  function handleClear() {
    setLocalError(null);
    onFileChange(null);
    if (browseInputRef.current) browseInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-800">{label}</span>

      {/* Hidden inputs: standard gallery/file picker + mobile rear camera */}
      <input
        ref={browseInputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(e) => validateAndSelect(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
      <input
        ref={cameraInputRef}
        id={`${id}-camera`}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        onChange={(e) => validateAndSelect(e.target.files?.[0] ?? null)}
        className="sr-only"
      />

      {file && previewUrl ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected evidence preview"
            className="w-full h-52 object-cover rounded-lg border border-slate-200 bg-white"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate max-w-[220px]">{file.name}</p>
              <p className="text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for intake &amp; EXIF stripping
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => browseInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-upload
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-red-200 bg-red-50 text-red-800 font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
            dragging
              ? "border-blue-600 bg-blue-50/70"
              : "border-slate-300 bg-slate-50 hover:bg-slate-100/70"
          }`}
        >
          <UploadCloud className="w-7 h-7 text-slate-500 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-800">
            {dragging ? "Drop your street photo here" : "Drag & drop a street photo, or choose below"}
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            JPEG, PNG, or WebP (max 5 MB) • EXIF/GPS stripped • Non-civic &amp; screenshot uploads blocked
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-blue-700 text-white text-xs sm:text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> Take Photo (Camera)
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => browseInputRef.current?.click()}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" /> Browse Files
            </button>
          </div>
        </div>
      )}

      {localError && (
        <p role="alert" className="text-xs text-red-700 font-medium">
          {localError}
        </p>
      )}
    </div>
  );
}