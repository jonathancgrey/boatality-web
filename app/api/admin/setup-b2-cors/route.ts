import { NextResponse } from "next/server";

// One-shot route: GET /api/admin/setup-b2-cors
// Sets CORS on the B2 bucket using the native B2 API (b2_update_bucket).
// The S3 PutBucketCors API does NOT configure CORS for S3-compatible browser
// uploads on B2 — the native API with s3_put in allowedOperations is required.
// Safe to call multiple times — idempotent.
export async function GET() {
  const bucket = process.env.B2_BUCKET_NAME;
  const keyId = process.env.B2_ACCESS_KEY_ID;
  const appKey = process.env.B2_SECRET_ACCESS_KEY;

  if (!bucket || !keyId || !appKey) {
    return NextResponse.json(
      { ok: false, error: "Missing B2 env vars: B2_BUCKET_NAME, B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY" },
      { status: 500 }
    );
  }

  try {
    // 1. Authorize with native B2 API
    const authRes = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${keyId}:${appKey}`).toString("base64"),
      },
    });

    if (!authRes.ok) {
      const text = await authRes.text().catch(() => "");
      throw new Error(`B2 authorization failed (${authRes.status}): ${text}`);
    }

    const auth = await authRes.json();
    const { authorizationToken, apiUrl, accountId } = auth;

    // 2. Find bucket ID by name
    const listRes = await fetch(
      `${apiUrl}/b2api/v2/b2_list_buckets?accountId=${accountId}&bucketName=${encodeURIComponent(bucket)}`,
      { headers: { Authorization: authorizationToken } }
    );

    if (!listRes.ok) {
      throw new Error(`Failed to list B2 buckets (${listRes.status})`);
    }

    const listData = await listRes.json();
    const bucketId: string | undefined = listData.buckets?.[0]?.bucketId;

    if (!bucketId) {
      throw new Error(`Bucket "${bucket}" not found in this B2 account`);
    }

    // 3. Apply CORS via native B2 API — includes s3_put so presigned URL PUTs
    //    from browsers pass CORS preflight checks on the S3-compatible endpoint.
    const updateRes = await fetch(`${apiUrl}/b2api/v2/b2_update_bucket`, {
      method: "POST",
      headers: {
        Authorization: authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        bucketId,
        corsRules: [
          {
            corsRuleName: "allowBrowserUpload",
            allowedOrigins: ["*"],
            allowedHeaders: ["*"],
            allowedOperations: [
              "b2_upload_file",
              "b2_upload_part",
              "b2_download_file_by_id",
              "b2_download_file_by_name",
              "s3_put",
              "s3_head",
              "s3_get",
              "s3_delete",
            ],
            exposeHeaders: ["ETag"],
            maxAgeSeconds: 3600,
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      const errBody = await updateRes.json().catch(() => ({}));
      throw new Error(`Failed to update bucket CORS (${updateRes.status}): ${JSON.stringify(errBody)}`);
    }

    const result = await updateRes.json();

    return NextResponse.json({
      ok: true,
      message: `CORS configured on B2 bucket "${bucket}" (${bucketId})`,
      corsRules: result.corsRules,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
