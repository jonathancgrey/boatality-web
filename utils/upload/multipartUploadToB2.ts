const DEFAULT_PART_SIZE = 10 * 1024 * 1024; // 10MB

export type MultipartUploadResult =
  | { ok: true; uploadId: string; key: string; bucket: string; partsUploaded: number }
  | { ok: false; error: string };

export async function multipartUploadToB2(opts: {
  file: File;
  key: string;
  contentType: string;
  partSizeBytes?: number;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
}): Promise<MultipartUploadResult> {
  const { file, key, contentType, partSizeBytes, signal, onProgress } = opts;

  if (!file) throw new Error("multipartUploadToB2: missing file");
  if (!key) throw new Error("multipartUploadToB2: missing key");

  const partSize = partSizeBytes ?? DEFAULT_PART_SIZE;
  const totalBytes = file.size;
  const totalParts = Math.ceil(totalBytes / partSize);

  // 1) initiate
  const initRes = await fetch("/api/videos/upload/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType }),
    signal,
  });

  const initJson: any = await initRes.json().catch(() => ({}));
  if (!initRes.ok || !initJson?.uploadId || !initJson?.bucket) {
    const msg = initJson?.error || initJson?.message || `initiate failed (${initRes.status})`;
    throw new Error(msg);
  }

  const uploadId: string = initJson.uploadId;
  const bucket: string = initJson.bucket;

  const parts: { partNumber: number; eTag: string }[] = [];

  let uploadedBytes = 0;
  let offset = 0;
  let partNumber = 1;

  // 2) upload parts
  while (offset < totalBytes) {
    const end = Math.min(offset + partSize, totalBytes);
    const chunk = file.slice(offset, end);

    const presignRes = await fetch("/api/videos/upload/presign-part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId, partNumber }),
      signal,
    });

    const presignJson: any = await presignRes.json().catch(() => ({}));
    if (!presignRes.ok || !presignJson?.url) {
      const msg = presignJson?.error || presignJson?.message || `presign failed (${presignRes.status})`;
      throw new Error(msg);
    }

    const putRes = await fetch(presignJson.url, {
      method: "PUT",
      body: chunk,
      // IMPORTANT: do NOT add extra headers unless you also sign them server-side.
      signal,
    });

    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      throw new Error(`Part ${partNumber} upload failed: ${putRes.status} ${putRes.statusText} ${text}`);
    }

    const eTag = putRes.headers.get("etag") || putRes.headers.get("ETag");
    if (!eTag) {
      throw new Error(`Missing ETag for part ${partNumber}`);
    }

    parts.push({ partNumber, eTag });

    uploadedBytes += chunk.size;
    offset = end;
    partNumber += 1;

    if (onProgress) {
      const pct = Math.min(100, Math.floor((uploadedBytes / totalBytes) * 100));
      onProgress(pct);
    }
  }

  // 3) complete
  const completeRes = await fetch("/api/videos/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, uploadId, parts }),
    signal,
  });

  const completeJson: any = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    const msg = completeJson?.error || completeJson?.message || `complete failed (${completeRes.status})`;
    throw new Error(msg);
  }

  // Some implementations return { ok: true }, some return { uploadId, partsUploaded } etc.
  const partsUploaded = parts.length;

  return { ok: true, uploadId, key, bucket, partsUploaded };
}
