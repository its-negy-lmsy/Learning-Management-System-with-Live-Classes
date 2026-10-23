import fs from "node:fs/promises";
import path from "node:path";
import { Redis } from "ioredis";
import { Queue } from "bullmq";
import { config } from "../config.js";
import { update } from "../db/store.js";
import type { MediaRecord } from "./types.js";
import { assertMediaTransition } from "../domain/media-state.js";

let redis: Redis | undefined;
let queue: Queue | undefined;
export const usesBullMQ = () => Boolean(config.redisUrl);

export async function enqueueMedia(media: MediaRecord) {
  assertMediaTransition(media.status, "QUEUED");
  await update<MediaRecord>("media_assets", media.id, { status: "QUEUED", progress: 0, queuedAt: new Date().toISOString() });
  if (config.redisUrl) {
    redis ??= new Redis(config.redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: true });
    queue ??= new Queue("media-processing", { connection: redis, defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } } });
    await queue.add("process-video", { mediaId: media.id }, { jobId: media.id });
    return "bullmq" as const;
  }
  const dir = path.join(config.root, "data", "jobs");
  await fs.mkdir(dir, { recursive: true });
  const destination = path.join(dir, `${media.id}.queued.json`);
  await fs.writeFile(destination, JSON.stringify({ mediaId: media.id, attempts: 0, queuedAt: new Date().toISOString() }), { flag: "wx" });
  return "local-file-queue" as const;
}

export async function closeQueue() {
  await queue?.close();
  await redis?.quit();
}
