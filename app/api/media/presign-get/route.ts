import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { b2s3 } from "@/lib/b2s3";

export async function POST(req: Request) {
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
