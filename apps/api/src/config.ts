import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(root, ".env") });
const int = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  root,
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: int(process.env.PORT, 4100),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5174",
  demoMode: process.env.DEMO_MODE === "true" || (!process.env.MONGODB_URI && process.env.NODE_ENV !== "production"),
  seedDemo: process.env.SEED_DEMO !== "false",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET ?? "local-development-secret-change-before-deploying-000000",
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  cookieSameSite: (process.env.COOKIE_SAME_SITE ?? "lax") as "lax" | "strict" | "none",
  uploadMaxBytes: int(process.env.UPLOAD_MAX_MB, 500) * 1024 * 1024,
  mediaRoot: path.isAbsolute(process.env.MEDIA_ROOT ?? "") ? process.env.MEDIA_ROOT! : path.resolve(root, process.env.MEDIA_ROOT ?? "storage"),
  mediaStorage: process.env.MEDIA_STORAGE ?? "local",
  redisUrl: process.env.REDIS_URL,
  awsRegion: process.env.AWS_REGION ?? "ap-south-1",
  s3Bucket: process.env.AWS_S3_BUCKET,
  cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN,
  cloudfrontKeyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
  cloudfrontPrivateKey: process.env.CLOUDFRONT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  livekitUrl: process.env.LIVEKIT_URL,
  livekitApiKey: process.env.LIVEKIT_API_KEY,
  livekitApiSecret: process.env.LIVEKIT_API_SECRET,
  paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
  cookieNames: { access: "fs03_access", refresh: "fs03_refresh" },
};

if (config.nodeEnv === "production" && config.demoMode) throw new Error("DEMO_MODE must be disabled in production.");
if (config.nodeEnv === "production" && (!process.env.JWT_SECRET || config.jwtSecret.length < 32)) throw new Error("Set JWT_SECRET to at least 32 random characters in production.");
