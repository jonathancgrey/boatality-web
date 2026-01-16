import { NextResponse } from "next/server";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { b2s3 } from "@/lib/b2s3";
import { createServerClient } from "@/lib/supabaseServer";

function getChannelIdFromKey(key: string) {
  const m = /^channels\/([^/]+)\//.exec(key);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json();
    const { key, contentType } = body ?? {};

    if (!key || !contentType) {
      return NextResponse.json({ ok: false, error: "Missing key or contentType" }, { status: 400 });
    }

    const channelId = getChannelIdFromKey(String(key));
    if (!channelId) {
      return NextResponse.json({ ok: false, error: "Invalid key format" }, { status: 400 });
    }

    const { data: channel } = await supabase
      .from("channels_v2")
      .select("id")
      .eq("id", channelId)
      .eq("creator_id", user.id)
      .maybeSingle();

    if (!channel) {
      return NextResponse.json({ ok: false, error: "Invalid channel" }, { status: 403 });
    }

    const bucket = process.env.B2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ ok: false, error: "Missing B2_BUCKET_NAME" }, { status: 500 });
    }

    const result = await b2s3.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    if (!result.UploadId) {
      return NextResponse.json({ ok: false, error: "Failed to create multipart upload" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, bucket, key, uploadId: result.UploadId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, name: err?.name ?? "B2Error", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
