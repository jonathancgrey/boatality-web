import { NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
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
    if (!user) return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });

    const body = await req.json();
    const { key, uploadId, parts } = body ?? {};

    if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing key, uploadId, or parts" }, { status: 400 });
    }

    const channelId = getChannelIdFromKey(String(key));
    if (!channelId) return NextResponse.json({ ok: false, error: "Invalid key format" }, { status: 400 });

    const { data: channel } = await supabase
      .from("channels_v2")
      .select("id")
      .eq("id", channelId)
      .eq("creator_id", user.id)
      .maybeSingle();

    if (!channel) return NextResponse.json({ ok: false, error: "Invalid channel" }, { status: 403 });

    const bucket = process.env.B2_BUCKET_NAME;
    if (!bucket) return NextResponse.json({ ok: false, error: "Missing B2_BUCKET_NAME" }, { status: 500 });

    const result = await b2s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts
            .map((p: any) => ({ PartNumber: Number(p.partNumber), ETag: String(p.eTag) }))
            .sort((a: any, b: any) => a.PartNumber - b.PartNumber),
        },
      })
    );

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, name: err?.name ?? "B2Error", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
