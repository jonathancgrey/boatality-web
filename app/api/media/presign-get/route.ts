import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { b2s3 } from "@/lib/b2s3";
import { supabaseRoute } from "@/lib/supabaseRoute";

export async function POST(req: Request) {
  // Require authentication
  const supabase = supabaseRoute();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { key } = body ?? {};
  if (!key || typeof key !== "string") {
    return NextResponse.json({ ok: false, error: "Missing or invalid key" }, { status: 400 });
  }

  // Ownership check: verify the key belongs to this user.
  //
  // Two path patterns are supported:
  //   branding/{userId}/...             → creator/channel branding
  //   channels/{channelSlug}/...        → channel content
  //
  // For branding paths we can verify the userId directly.
  // For channel content paths we look up the channel in the DB.
  const brandingMatch = /^branding\/([^/]+)\//.exec(key);
  if (brandingMatch) {
    const keyUserId = brandingMatch[1];
    if (keyUserId !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  } else {
    // Channel content: extract slug and verify creator ownership
    const channelSlugMatch = /^channels\/([^/]+)\//.exec(key);
    if (channelSlugMatch) {
      const slug = channelSlugMatch[1];
      // channels_v2 doesn't have a slug column yet — fall back to
      // verifying the user has at least one channel (prevents anonymous access).
      // TODO: add slug column to channels_v2 for exact ownership check.
      const { data: channel } = await supabase
        .from("channels_v2")
        .select("id")
        .eq("creator_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!channel) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const bucket = process.env.B2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ ok: false, error: "Missing B2_BUCKET_NAME env var" }, { status: 500 });
  }

  try {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(b2s3, cmd, { expiresIn: 60 * 10 });
    return NextResponse.json({ ok: true, url });
  } catch (err: any) {
    console.error("presign-get error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
