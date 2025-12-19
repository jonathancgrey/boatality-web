import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { b2s3 } from "@/lib/b2s3";

export async function GET() {
  try {
    const bucket = process.env.B2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ ok: false, error: "Missing B2_BUCKET_NAME" }, { status: 500 });
    }

    const out = await b2s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 5,
      })
    );

    return NextResponse.json({
      ok: true,
      bucket,
      sampleKeys: (out.Contents ?? []).map((o) => o.Key).filter(Boolean),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, name: err?.name ?? "B2Error", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}