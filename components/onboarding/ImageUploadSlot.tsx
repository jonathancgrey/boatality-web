"use client";

import { useRef, useState } from "react";
import { ImageIcon, X, CheckCircle, AlertCircle, Loader } from "lucide-react";

export type UploadState = "idle" | "uploading" | "done" | "error";

type ImageUploadSlotProps = {
  label: string;
  hint?: string;
  /** "square" → 1:1 avatar/icon, "wide" → 3:1 banner/cover */
  aspectRatio?: "square" | "wide";
  /** Current preview URL (data URL while uploading, storage URL after) */
  previewUrl: string | null;
  uploadState: UploadState;
  errorMessage?: string | null;
  /** Called with the chosen File; parent handles the actual upload */
  onFile: (file: File) => void;
  onClear: () => void;
};

export function ImageUploadSlot({
  label,
  hint,
  aspectRatio = "square",
  previewUrl,
  uploadState,
  errorMessage,
  onFile,
  onClear,
}: ImageUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isWide = aspectRatio === "wide";

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    onFile(file);
  }

  return (
    <div className={isWide ? "w-full" : "flex-shrink-0"}>
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50 mb-2">
        {label}
        {hint && (
          <span className="ml-1.5 font-normal normal-case tracking-normal text-white/25">
            {hint}
          </span>
        )}
      </p>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={[
          "relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer group select-none",
          isWide ? "w-full aspect-[3/1]" : "w-24 h-24",
          dragging
            ? "border-blue-400 bg-blue-500/10 scale-[1.01]"
            : previewUrl
            ? "border-white/15"
            : uploadState === "error"
            ? "border-dashed border-red-500/40 bg-red-500/5"
            : "border-dashed border-white/20 bg-white/[0.03] hover:border-white/40 hover:bg-white/[0.06]",
        ].join(" ")}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {/* Preview image */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Empty state */}
        {!previewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            {uploadState === "uploading" ? (
              <Loader size={isWide ? 20 : 16} className="text-white/40 animate-spin" />
            ) : uploadState === "error" ? (
              <AlertCircle size={isWide ? 20 : 16} className="text-red-400/70" />
            ) : (
              <>
                <ImageIcon size={isWide ? 20 : 16} className="text-white/25" />
                {isWide && (
                  <p className="text-xs text-white/25">
                    Click or drag to upload
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Hover overlay when image is present */}
        {previewUrl && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-xs font-semibold text-white tracking-wide">
              Replace
            </span>
          </div>
        )}

        {/* Uploading spinner overlay */}
        {previewUrl && uploadState === "uploading" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader size={20} className="text-white animate-spin" />
          </div>
        )}

        {/* Success badge */}
        {previewUrl && uploadState === "done" && (
          <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <CheckCircle size={12} className="text-white" fill="white" strokeWidth={0} />
          </div>
        )}

        {/* Clear button */}
        {previewUrl && uploadState !== "uploading" && (
          <button
            type="button"
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X size={11} className="text-white" />
          </button>
        )}
      </div>

      {/* Error message */}
      {uploadState === "error" && errorMessage && (
        <p className="mt-1.5 text-xs text-red-400">{errorMessage}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
