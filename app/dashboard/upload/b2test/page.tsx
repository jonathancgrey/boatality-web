"use client";

import { useMemo, useRef, useState } from "react";
import { multipartUploadToB2 } from "@/utils/upload/multipartUploadToB2";

export default function B2MultipartUploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const pretty = useMemo(() => {
    if (!file) return null;
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} (${mb} MB)`;
  }, [file]);

  async function startUpload() {
    if (!file) return;

    setError(null);
    setResultKey(null);
    setProgress(0);
    setStatus("uploading");

    abortRef.current = new AbortController();

    const key = `raw/test/${Date.now()}-${file.name.replaceAll(" ", "_")}`;

    try {
      const res = await multipartUploadToB2({
        file,
        key,
        onProgress: (p) => setProgress(p.percent),
        signal: abortRef.current.signal,
      });

      setResultKey(res.key);
      setStatus("done");
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setStatus("cancelled");
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
        B2 Multipart Upload Test
      </h1>

      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        This page uploads a file directly to Backblaze B2 using presigned multipart URLs.
      </p>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div style={{ marginTop: 12, opacity: 0.9 }}>
        {pretty ? <div>Selected: {pretty}</div> : <div>No file selected</div>}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <button
          onClick={startUpload}
          disabled={!file || status === "uploading"}
          style={{ padding: "8px 12px" }}
        >
          Upload to B2
        </button>

        <button
          onClick={cancel}
          disabled={status !== "uploading"}
          style={{ padding: "8px 12px" }}
        >
          Cancel
        </button>

        <div style={{ marginLeft: "auto", minWidth: 140, textAlign: "right" }}>
          {status === "uploading" ? `${progress.toFixed(1)}%` : status}
        </div>
      </div>

      <div style={{ marginTop: 12, height: 10, background: "rgba(0,0,0,0.1)", borderRadius: 8 }}>
        <div
          style={{
            height: 10,
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: "rgba(0,0,0,0.5)",
            borderRadius: 8,
            transition: "width 150ms linear",
          }}
        />
      </div>

      {resultKey && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600 }}>Uploaded key:</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{resultKey}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, color: "crimson" }}>
          <div style={{ fontWeight: 600 }}>Error:</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
        </div>
      )}
    </div>
  );
}
