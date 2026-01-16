"use server";

import { createServerClient } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";

// In Server Actions, FormData file values are `File`/`Blob`-like.
// Supabase Storage on the server works reliably with a Node Buffer.
async function fileToBuffer(file: File): Promise<Buffer> {
  const ab = await file.arrayBuffer();
  return Buffer.from(ab);
}

export async function uploadContent(formData: FormData) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in." };

  const channelId = formData.get("channelId")?.toString();
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const primaryCategory = formData.get("primaryCategory")?.toString();
  const contentType = formData.get("contentType")?.toString(); // content_v2.type

  // File inputs come through FormData as `File` values. Support both field names.
  const thumbnailFile = (formData.get("thumbnail") || formData.get("thumbnailFile")) as File | null;

  const mediaUrlRaw = formData.get("mediaUrl")?.toString() || null;

  // Normalize media URL so the app always plays via Cloudflare Worker
  // Accepts:
  // - b2://<bucket>/<key>
  // - https://s3.<region>.backblazeb2.com/<bucket>/<key>
  // - https://<bucket>.s3.<region>.backblazeb2.com/<key>
  // Produces:
  // - https://media.boatality.com/<key>
  const normalizeMediaUrl = (input: string | null): { mediaUrl: string | null; mediaKey: string | null } => {
    if (!input) return { mediaUrl: null, mediaKey: null };

    const s = String(input).trim();
    if (!s) return { mediaUrl: null, mediaKey: null };

    // b2://bucket/key
    if (s.startsWith("b2://")) {
      const rest = s.slice("b2://".length);
      const firstSlash = rest.indexOf("/");
      if (firstSlash > 0 && firstSlash < rest.length - 1) {
        const key = rest.slice(firstSlash + 1);
        return { mediaUrl: `https://media.boatality.com/${key}`, mediaKey: key };
      }
      // malformed, just return as-is
      return { mediaUrl: s, mediaKey: null };
    }

    // Backblaze S3 style URLs
    try {
      const u = new URL(s);
      const host = u.host.toLowerCase();

      // https://s3.<region>.backblazeb2.com/<bucket>/<key>
      if (host.startsWith("s3.") && host.endsWith(".backblazeb2.com")) {
        const parts = u.pathname.split("/").filter(Boolean);
        // parts[0] = bucket, rest = key
        if (parts.length >= 2) {
          const key = parts.slice(1).join("/");
          return { mediaUrl: `https://media.boatality.com/${key}`, mediaKey: key };
        }
      }

      // https://<bucket>.s3.<region>.backblazeb2.com/<key>
      if (host.includes(".s3.") && host.endsWith(".backblazeb2.com")) {
        const key = u.pathname.replace(/^\//, "");
        if (key) return { mediaUrl: `https://media.boatality.com/${key}`, mediaKey: key };
      }

      // already through worker
      if (host === "media.boatality.com") {
        const key = u.pathname.replace(/^\//, "");
        return { mediaUrl: s, mediaKey: key || null };
      }

      // If it's some other absolute URL, keep it.
      return { mediaUrl: s, mediaKey: null };
    } catch {
      // Not a URL; keep as-is
      return { mediaUrl: s, mediaKey: null };
    }
  };

  const { mediaUrl, mediaKey: _mediaKey } = normalizeMediaUrl(mediaUrlRaw);

  if (!channelId || !title || !contentType || !mediaUrl) {
    return { error: "Missing required fields (channelId/title/contentType/mediaUrl)." };
  }

  // Validate channel ownership
  const { data: channel } = await supabase
    .from("channels_v2")
    .select("id,creator_id,type")
    .eq("id", channelId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (!channel) return { error: "Invalid channel." };

  // TEMP: keep thumbnail in Supabase storage until we move it to B2
  let thumbnailUrl: string | null = null;
  if (thumbnailFile && typeof (thumbnailFile as any).arrayBuffer === "function") {
    const originalName = (thumbnailFile as any).name || "thumbnail";
    const extRaw = String(originalName).includes(".") ? String(originalName).split(".").pop() : "";
    const ext = (extRaw || "jpg").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    const thumbPath = `channels/${channelId}/thumbnails/${randomUUID()}.${ext}`;

    // Convert to Buffer for server-side upload (avoids RSC/File boundary issues)
    const buf = await fileToBuffer(thumbnailFile);

    const { error: thumbErr } = await supabase.storage
      .from("creator-media")
      .upload(thumbPath, buf, {
        contentType: thumbnailFile.type || "image/jpeg",
        upsert: false,
      });

    if (thumbErr) return { error: thumbErr.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from("creator-media").getPublicUrl(thumbPath);

    thumbnailUrl = publicUrl;
  }

  const contentId = randomUUID();

  const { error: dbError } = await supabase.from("content_v2").insert({
    id: contentId,
    channel_id: channelId,
    creator_id: user.id,
    type: contentType,
    title,
    description,
    media_url: mediaUrl,
    // Optional: keep key for debugging/migrations later (only if your table has the column)
    // media_key: mediaKey,
    thumbnail_url: thumbnailUrl,
    category_id: primaryCategory || null,
    status: "draft",
  });

  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/content");
  return { success: true, id: contentId };
}
