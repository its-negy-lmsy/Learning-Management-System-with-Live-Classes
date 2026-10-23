import fs from "node:fs/promises";
import path from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as signCloudFrontUrl } from "@aws-sdk/cloudfront-signer";
import { getSignedUrl as signS3Url } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";

const s3Configured = Boolean(config.s3Bucket);
let client: S3Client | undefined;
const s3 = () => client ??= new S3Client({ region: config.awsRegion });
export const remoteMediaEnabled = () => s3Configured;

export async function uploadFile(key: string, localPath: string, contentType: string) {
  if (!s3Configured) throw new Error("AWS_S3_BUCKET is not configured.");
  await s3().send(new PutObjectCommand({ Bucket: config.s3Bucket, Key: key, Body: createReadStream(localPath), ContentType: contentType, CacheControl: key.includes("/segments/") ? "public, max-age=31536000, immutable" : "private, max-age=60" }));
}

export async function downloadFile(key: string, localPath: string) {
  if (!s3Configured) throw new Error("AWS_S3_BUCKET is not configured.");
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  const response = await s3().send(new GetObjectCommand({ Bucket: config.s3Bucket, Key: key }));
  if (!response.Body) throw new Error("Stored media object has no body.");
  await pipeline(response.Body as NodeJS.ReadableStream, createWriteStream(localPath));
}

export async function readObjectText(key: string) {
  const response = await s3().send(new GetObjectCommand({ Bucket: config.s3Bucket, Key: key }));
  if (!response.Body) throw new Error("Stored media object has no body.");
  return response.Body.transformToString();
}

export async function playbackAssetUrl(key: string, expiresSeconds = 900) {
  if (config.cloudfrontDomain && config.cloudfrontKeyPairId && config.cloudfrontPrivateKey) {
    const url = `https://${config.cloudfrontDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
    return signCloudFrontUrl({ url, keyPairId: config.cloudfrontKeyPairId, privateKey: config.cloudfrontPrivateKey, dateLessThan: new Date(Date.now() + expiresSeconds * 1000).toISOString() });
  }
  return signS3Url(s3(), new GetObjectCommand({ Bucket: config.s3Bucket, Key: key }), { expiresIn: expiresSeconds });
}
