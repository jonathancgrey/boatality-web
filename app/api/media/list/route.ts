import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
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
      // For channel paths, verify the user has at least one channel (basic guard).
      // TODO: tighten once channels_v2 has a slug column.
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

    const out = await b2s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: maxKeys })
    );

    const keys = (out.Contents || []).map((x) => x.Key).filter(Boolean);
    return NextResponse.json({ ok: true, prefix, count: keys.length, keys });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
