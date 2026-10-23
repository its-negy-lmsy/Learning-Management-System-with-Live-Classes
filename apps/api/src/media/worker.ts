import fs from "node:fs/promises";
import path from "node:path";
import { Redis } from "ioredis";
import { Worker } from "bullmq";
import { config } from "../config.js";
import { connectDatabase } from "../db/store.js";
import { processMediaJob } from "./processor.js";

async function runLocalQueue(signal: AbortSignal) {
  const jobsDir = path.join(config.root, "data", "jobs");
  await fs.mkdir(jobsDir, { recursive: true });
  console.info("Worker: durable local file queue (development mode)");
  while (!signal.aborted) {
    const files = (await fs.readdir(jobsDir)).filter((file) => file.endsWith(".queued.json")).sort();
    let didWork = false;
    for (const file of files) {
      const from = path.join(jobsDir, file);
      const to = from.replace(/\.queued\.json$/, ".working.json");
      try { await fs.rename(from, to); } catch { continue; }
      didWork = true;
      const job = JSON.parse(await fs.readFile(to, "utf8")) as { mediaId: string; attempts: number };
      try {
        await processMediaJob(job.mediaId);
        await fs.rm(to, { force: true });
      } catch (error) {
        const attempts = job.attempts + 1;
        if (attempts < 3) {
          await fs.writeFile(from, JSON.stringify({ ...job, attempts, retryAt: new Date().toISOString() }));
          await fs.rm(to, { force: true });
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempts));
        } else {
          console.error(`Media job ${job.mediaId} failed after ${attempts} attempts.`, error);
          await fs.rm(to, { force: true });
        }
      }
    }
    if (!didWork) await new Promise((resolve) => setTimeout(resolve, 1200));
  }
}

async function main() {
  await connectDatabase();
  if (config.redisUrl) {
    const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
    const worker = new Worker("media-processing", async (job) => processMediaJob(String(job.data.mediaId)), { connection, concurrency: 1, autorun: true });
    worker.on("completed", (job) => console.info(`Media job ${job.id} completed.`));
    worker.on("failed", (job, error) => console.error(`Media job ${job?.id ?? "unknown"} failed.`, error.message));
    console.info("Worker: BullMQ media-processing queue, concurrency 1");
    const stop = async () => { await worker.close(); await connection.quit(); process.exit(0); };
    process.once("SIGINT", stop); process.once("SIGTERM", stop);
    return;
  }
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
  await runLocalQueue(controller.signal);
}

main().catch((error) => { console.error("Media worker failed to start.", error); process.exitCode = 1; });
