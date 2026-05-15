import { NextResponse } from "next/server";
import { PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { b2s3 } from "@/lib/b2s3";

// One-shot route: GET /api/admin/setup-b2-cors
// Sets CORS on the B2 bucket so browsers can PUT directly to presigned URLs.
// Safe to call multiple times — idempotent.
export async function GET() {
  const bucket = process.env.B2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ ok: false, error: "Missing B2_BUCKET_NAME env var" }, { status: 500 });
  }

  try {
    await b2s3.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );

    // Verify it was applied
    const { CORSRules } = await b2s3.send(new GetBucketCorsCommand({ Bucket: bucket }));

    return NextResponse.json({
      ok: true,
      message: `CORS configured on bucket: ${bucket}`,
      rules: CORSRules,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
