import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.B2_S3_ENDPOINT;
const region = process.env.B2_S3_REGION;
const accessKeyId = process.env.B2_ACCESS_KEY_ID;
const secretAccessKey = process.env.B2_SECRET_ACCESS_KEY;

if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "Missing B2 env vars. Required: B2_S3_ENDPOINT, B2_S3_REGION, B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY"
  );
}

export const b2s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },

  // Important for browser presigned PUTs against some S3-compatible providers (B2):
  // avoid flexible checksum features that introduce extra preflight requirements.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
