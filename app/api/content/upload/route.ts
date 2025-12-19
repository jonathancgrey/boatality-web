import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { slugify } from "@/utils/slugify";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const channelId = formData.get("channelId") as string | null;
    const type = formData.get("type") as string | null; // "video" | "podcast" | "article"

    if (!file || !title || !channelId || !type) {
      return NextResponse.json(
        { error: "Missing required fields (file, title, channelId, type)." },
        { status: 400 }
      );
    }

    if (!["video", "podcast", "article"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid content type." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Fetch channel to get name + creator_id
    const { data: channel, error: channelError } = await supabase
      .from("channels_v2")
      .select("id, name, creator_id")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "Channel not found." },
        { status: 404 }
      );
    }

    const channelSlug = slugify(channel.name);
    const originalName = file.name || "upload";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop()
      : "bin";

    // UUID-ish unique id using crypto.randomUUID when available
    const uniqueId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const safeExt = ext || "bin";
    const mediaTypeFolder = type; // "video" | "podcast" | "article"
    const objectPath = `channels/${channelSlug}/${mediaTypeFolder}/${uniqueId}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("creator-media")
      .upload(objectPath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Insert into content_v2
    const { error: insertError, data: inserted } = await supabase
      .from("content_v2")
      .insert({
        title,
        description,
        type,
        creator_id: channel.creator_id,
        channel_id: channel.id,
        media_url: objectPath,
        status: "draft",
        published_at: null, // override default so drafts are not "published"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        path: objectPath,
        content: inserted,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected error in upload route:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
