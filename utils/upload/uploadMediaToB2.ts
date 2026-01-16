import { multipartUploadToB2 } from "@/utils/upload/multipartUploadToB2";

export async function uploadMediaToB2(opts: {
  file: File;
  channelId: string;
  contentType: "video" | "podcast" | "article";
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}) {
  const { file, channelId, contentType, onProgress, signal } = opts;

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const key = `channels/${channelId}/${contentType}/${crypto.randomUUID()}.${ext}`;

  try {
    const res = await multipartUploadToB2({
      file,
      key,
      contentType: file.type || "application/octet-stream",
      onProgress,
      signal,
    });

    if (!res.ok) {
      throw new Error(`B2 upload failed (unknown): ${JSON.stringify(res)}`);
    }

    return { key, bucket: res.bucket };
  } catch (err: any) {
    // IMPORTANT: bubble the real reason up to the UI
    throw new Error(err?.message ?? String(err));
  }
}
