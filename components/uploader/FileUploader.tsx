"use client";

import { useState } from "react";

type FileUploaderProps = {
  onFileSelected: (file: File) => void;
};

export default function FileUploader({ onFileSelected }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
    onFileSelected(file);
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
        ${dragging ? "border-sky-500 bg-sky-50" : "border-slate-400 bg-white"}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <p className="text-sm text-slate-600">
          Drag & drop your media file here, or <span className="font-semibold">click to browse</span>
        </p>
        {fileName && (
          <p className="mt-2 text-xs text-slate-500">
            Selected: <span className="font-medium">{fileName}</span>
          </p>
        )}
      </div>
      <input
        id="fileInput"
        type="file"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
