import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { config } from "./config.js";
import { connectDatabase, isLocalStore } from "./db/store.js";
import { authRouter } from "./routes/auth.js";
import { coursesRouter } from "./routes/courses.js";
import { learningRouter } from "./routes/learning.js";
import { mediaRouter } from "./routes/media.js";
import { paymentsRouter, stripeWebhookHandler } from "./routes/payments.js";
import { liveClassesRouter } from "./routes/live-classes.js";
import { certificatesRouter } from "./routes/certificates.js";
import { staffRouter } from "./routes/staff.js";
import { errorHandler } from "./utils/http.js";
import { seedDemoData } from "./scripts/seed.js";

async function main() {
  await connectDatabase();
  await fs.mkdir(path.join(config.mediaRoot, "incoming"), { recursive: true });
  if (config.demoMode && config.seedDemo) await seedDemoData();

  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));
  app.use(cors({ origin: config.webOrigin, credentials: true, methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"] }));
  app.use((req, res, next) => {
    const requestId = req.header("x-request-id")?.slice(0, 80) || crypto.randomUUID();
    res.setHeader("x-request-id", requestId);
    next();
  });
  app.use(cookieParser());
  app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }));
  app.post("/api/v1/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }), stripeWebhookHandler);
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "fs03-api", timestamp: new Date().toISOString() }));
  app.get("/ready", (_req, res) => res.json({ status: "ready", persistence: isLocalStore() ? "development-json" : "mongodb", queue: process.env.REDIS_URL ? "bullmq-configured" : "local-file-development" }));
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", coursesRouter);
  app.use("/api/v1", learningRouter);
  app.use("/api/v1", mediaRouter);
  app.use("/api/v1", liveClassesRouter);
  app.use("/api/v1", paymentsRouter);
  app.use("/api/v1", certificatesRouter);
  app.use("/api/v1", staffRouter);
  try {
    const openapi = YAML.parse(await fs.readFile(path.join(config.root, "apps", "api", "openapi.yaml"), "utf8"));
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));
  } catch { console.warn("OpenAPI file was not found; Swagger UI is unavailable."); }
  app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "We couldn't find that endpoint." } }));
  app.use(errorHandler);

  const server = app.listen(config.port, () => console.info(`FS-03 API listening at http://localhost:${config.port}`));
  const close = () => server.close(() => process.exit(0));
  process.once("SIGINT", close); process.once("SIGTERM", close);
}

main().catch((error) => { console.error("API failed to start.", error); process.exitCode = 1; });
