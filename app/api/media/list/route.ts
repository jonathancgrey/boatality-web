import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { b2s3 } from "@/lib/b2s3";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const bucket = String(process.env.B2_BUCKET_NAME || "");
    const prefix = String(body?.prefix || "").trim();
    const maxKeys = Number(body?.maxKeys || 50);

    if (!bucket) return NextResponse.json({ ok: false, error: "Missing B2_BUCKET_NAME" }, { status: 500 });
    if (!prefix) return NextResponse.json({ ok: false, error: "Missing prefix" }, { status: 400 });

    const out = await b2s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })
    );

    const keys = (out.Contents || []).map(x => x.Key).filter(Boolean);
    return NextResponse.json({ ok: true, bucket, prefix, count: keys.length, keys });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
