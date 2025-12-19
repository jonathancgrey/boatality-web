import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { slugify } from "@/utils/slugify";

type ChannelPayload = {
  type: "video" | "podcast" | "article";
  name: string;
  description: string;
  categoryId: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = body.userId as string | undefined;
    const displayName = body.displayName as string | undefined;
    const bio = (body.bio as string | undefined) ?? null;
    const channels = (body.channels as ChannelPayload[] | undefined) ?? [];

    if (!userId || !displayName) {
      return NextResponse.json(
        { error: "Missing userId or displayName." },
        { status: 400 }
      );
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { error: "At least one channel is required." },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Ensure creator exists, using auth.user.id as creators_v2.id
    const { data: existingCreator, error: creatorSelectError } = await supabase
      .from("creators_v2")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (creatorSelectError) {
      console.error("Error checking creator:", creatorSelectError);
      return NextResponse.json(
        { error: creatorSelectError.message },
        { status: 500 }
      );
    }

    let creatorId = userId;

    if (!existingCreator) {
      const { data: insertedCreator, error: insertCreatorError } = await supabase
        .from("creators_v2")
        .insert({
          id: userId,
          display_name: displayName,
          bio,
        })
        .select("id")
        .single();

      if (insertCreatorError || !insertedCreator) {
        console.error("Error inserting creator:", insertCreatorError);
        return NextResponse.json(
          { error: insertCreatorError?.message || "Failed to create creator." },
          { status: 500 }
        );
      }

      creatorId = insertedCreator.id;
    }

    // For each channel type, ensure at most one channel per creator + type
    const allowedTypes = ["video", "podcast", "article"];

    const toCreate: ChannelPayload[] = [];
    for (const ch of channels) {
      if (!allowedTypes.includes(ch.type)) continue;
      if (!ch.name || !ch.categoryId) {
        return NextResponse.json(
          { error: `Missing name or category for channel type '${ch.type}'.` },
          { status: 400 }
        );
      }
      toCreate.push(ch);
    }

    // Check for existing channels of those types
    const typesToCheck = toCreate.map((c) => c.type);
    const { data: existingChannels, error: existingChannelsError } =
      await supabase
        .from("channels_v2")
        .select("id, type")
        .eq("creator_id", creatorId)
        .in("type", typesToCheck);

    if (existingChannelsError) {
      console.error("Error checking existing channels:", existingChannelsError);
      return NextResponse.json(
        { error: existingChannelsError.message },
        { status: 500 }
      );
    }

    const existingTypes = new Set(
      (existingChannels ?? []).map((c: any) => c.type as string)
    );

    const finalCreates = toCreate.filter((ch) => !existingTypes.has(ch.type));

    const channelInserts = finalCreates.map((ch) => {
      const slug = slugify(ch.name);
      return {
        creator_id: creatorId,
        name: ch.name,
        description: ch.description || null,
        type: ch.type,
        category_id: ch.categoryId,
        // avatar_url, banner_url can be wired up later via channel settings
        avatar_url: null,
        banner_url: null,
        // We can also add a slug column later; for now we can keep using name->slug in storage paths.
      };
    });

    let insertedChannels = null;

    if (channelInserts.length > 0) {
      const { data: inserted, error: insertChannelsError } = await supabase
        .from("channels_v2")
        .insert(channelInserts)
        .select("*");

      if (insertChannelsError) {
        console.error("Error inserting channels:", insertChannelsError);
        return NextResponse.json(
          { error: insertChannelsError.message },
          { status: 500 }
        );
      }

      insertedChannels = inserted;
    }

    return NextResponse.json(
      {
        success: true,
        creatorId,
        createdChannels: insertedChannels,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Onboarding route error:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error." },
      { status: 500 }
    );
  }
}
