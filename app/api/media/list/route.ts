import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { b2s3 } from "@/lib/b2s3";
import { supabaseRoute } from "@/lib/supabaseRoute";
import { slugify } from "@/utils/slugify";

export async function POST(req: Request) {
  // Require authentication
  const supabase = supabaseRoute();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const bucket = String(process.env.B2_BUCKET_NAME || "");
    const prefix = String(body?.prefix || "").trim();
    const maxKeys = Math.min(Number(body?.maxKeys || 50), 200); // cap at 200

    if (!bucket) return NextResponse.json({ ok: false, error: "Missing B2_BUCKET_NAME" }, { status: 500 });
    if (!prefix) return NextResponse.json({ ok: false, error: "Missing prefix" }, { status: 400 });

    // Ownership check: prefix must start with a path this user controls.
    // Branding paths embed the userId directly.
    // Channel content paths require the user to own the channel.
    const brandingMatch = /^branding\/([^/]+)/.exec(prefix);
    if (brandingMatch) {
      if (brandingMatch[1] !== user.id) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    } else {
      // Channel paths: the prefix segment is either the channel id (multipart
      // video uploads) or slugify(channel.name) (storage uploads). Require an
      // exact match against a channel this user owns.
      const channelMatch = /^channels\/([^/]+)/.exec(prefix);
      if (!channelMatch) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }

      const seg = channelMatch[1];
      const { data: channels } = await supabase
        .from("channels_v2")
        .select("id, name")
        .eq("creator_id", user.id);

      const owned = (channels ?? []).some(
        (c) => slugify(c.name ?? "") === seg || c.id === seg
      );

      if (!owned) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const out = await b2s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: maxKeys })
    );

    const keys = (out.Contents || []).map((x) => x.Key).filter(Boolean);
    return NextResponse.json({ ok: true, prefix, count: keys.length, keys });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
