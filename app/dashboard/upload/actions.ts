"use server";

import { createServerClient } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export async function uploadContent(formData: FormData) {
  const supabase = createServerClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in." };

  // Extract form values
  const channelId = formData.get("channelId")?.toString();
  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const primaryCategory = formData.get("primaryCategory")?.toString();
  const secondaryCategories = formData.getAll("secondaryCategories[]").map(String);
  const contentType = formData.get("contentType")?.toString();

  const file = formData.get("file") as File | null;
  const thumbnail = formData.get("thumbnail") as File | null;

  if (!channelId || !title || !file) {
    return { error: "Missing required fields." };
  }

  // Validate channel ownership
  const { data: channel } = await supabase
    .from("channels_v2")
    .select("*")
    .eq("id", channelId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (!channel) return { error: "Invalid channel." };

  // Upload file into storage
  const fileExt = file.name.split(".").pop();
  const filePath = `channels/${channelId}/${contentType}/${randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("creator-media")
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl: filePublicUrl } } =
    supabase.storage.from("creator-media").getPublicUrl(filePath);

  // Upload thumbnail if provided
  let thumbnailUrl = null;

  if (thumbnail) {
    const thumbExt = thumbnail.name.split(".").pop();
    const thumbPath = `channels/${channelId}/thumbnails/${randomUUID()}.${thumbExt}`;

    const { error: thumbError } = await supabase.storage
      .from("creator-media")
      .upload(thumbPath, thumbnail, {
        contentType: thumbnail.type,
        upsert: false,
      });

    if (thumbError) return { error: thumbError.message };

    const { data: { publicUrl } } =
      supabase.storage.from("creator-media").getPublicUrl(thumbPath);

    thumbnailUrl = publicUrl;
  }

  // Insert into content_v2
  const { error: dbError } = await supabase.from("content_v2").insert({
    channel_id: channelId,
    creator_id: user.id,
    title,
    description,
    content_type: contentType,
    url: filePublicUrl,
    thumbnail_url: thumbnailUrl,
    category_id: primaryCategory,
    secondary_category_ids: secondaryCategories,
  });

  if (dbError) return { error: dbError.message };

  revalidatePath("/dashboard/content");
  return { success: true };
}
