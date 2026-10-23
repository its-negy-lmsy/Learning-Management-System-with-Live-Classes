import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { all, get, insert, update } from "../db/store.js";
import { config } from "../config.js";
import { id, now } from "../utils/ids.js";
import { allowRoles, authenticate, optionalAuthenticate, type AuthUser } from "../utils/auth.js";
import { asyncRoute, HttpError, pathParam } from "../utils/http.js";
import { findLesson, requireCourse, requireCourseOwner, canAccessLesson, type CourseRecord } from "./course-utils.js";
import { enqueueMedia } from "../media/queue.js";
import { playbackAssetUrl, readObjectText, remoteMediaEnabled, uploadFile } from "../media/storage.js";
import type { MediaRecord } from "../media/types.js";

const incoming = path.join(config.mediaRoot, "incoming");
const allowedMime = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/mpeg"]);
const upload = multer({
  storage: multer.diskStorage({ destination: (_req, _file, cb) => { fs.mkdir(incoming, { recursive: true }).then(() => cb(null, incoming), (error) => cb(error, incoming)); }, filename: (_req, _file, cb) => cb(null, `${id()}.upload`) }),
  limits: { fileSize: config.uploadMaxBytes, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) => allowedMime.has(file.mimetype) ? cb(null, true) : cb(new HttpError(415, "UNSUPPORTED_VIDEO", "Upload an MP4, WebM, MOV, MKV, or MPEG video.")),
});

export const mediaRouter = Router();
mediaRouter.get("/dev/sample-video", asyncRoute(async (_req, res) => {
  if (!config.demoMode) throw new HttpError(404, "NOT_FOUND", "We couldn't find that file.");
  const sample = path.join(config.mediaRoot, "samples", "fs03-sample.mp4");
  try { await fs.access(sample); }
  catch { throw new HttpError(404, "SAMPLE_NOT_GENERATED", "Run npm run media:sample to create the sample video first."); }
  res.download(sample, "fs03-sample.mp4");
}));
mediaRouter.post("/instructor/lessons/:lessonId/media", authenticate, allowRoles("INSTRUCTOR"), upload.single("video"), asyncRoute(async (req, res) => {
  if (!req.file) throw new HttpError(400, "VIDEO_REQUIRED", "Choose a video file to upload.");
  const course = (await all<CourseRecord>("courses")).find((candidate) => candidate.instructorId === req.user!.id && candidate.sections.some((section) => section.lessons.some((lesson) => lesson.id === pathParam(req, "lessonId"))));
  if (!course) { await fs.rm(req.file.path, { force: true }); throw new HttpError(404, "LESSON_NOT_FOUND", "We couldn't find a lesson you own."); }
  const { lesson } = findLesson(course, pathParam(req, "lessonId"));
  if (lesson.mediaAssetId) {
    const old = await get<MediaRecord>("media_assets", lesson.mediaAssetId);
    if (old && ["QUEUED", "PROCESSING"].includes(old.status)) { await fs.rm(req.file.path, { force: true }); throw new HttpError(409, "MEDIA_ALREADY_PROCESSING", "Wait for the current upload to finish before replacing it."); }
  }
  const mediaId = id();
  const sourceKey = remoteMediaEnabled() ? `source/${course.id}/${lesson.id}/${mediaId}/source` : undefined;
  const media: MediaRecord = { id: mediaId, lessonId: lesson.id, courseId: course.id, ownerId: req.user!.id, originalName: path.basename(req.file.originalname).slice(0, 150), mimeType: req.file.mimetype, sizeBytes: req.file.size, sourcePath: remoteMediaEnabled() ? undefined : req.file.path, sourceKey, status: "UPLOADED", progress: 0, createdAt: now() };
  try {
    await insert("media_assets", media);
    if (sourceKey) { await uploadFile(sourceKey, req.file.path, req.file.mimetype); await fs.rm(req.file.path, { force: true }); }
    lesson.mediaAssetId = media.id;
    await update<CourseRecord>("courses", course.id, { sections: course.sections, updatedAt: now() } as Partial<CourseRecord>);
    const queue = await enqueueMedia(media);
    res.status(202).json({ media: { id: media.id, lessonId: media.lessonId, status: "QUEUED", progress: 0, originalName: media.originalName, createdAt: media.createdAt }, queue });
  } catch (error) {
    await fs.rm(req.file.path, { force: true }).catch(() => undefined);
    throw error;
  }
}));

async function authorizeMedia(mediaId: string, user?: AuthUser) {
  const media = await get<MediaRecord>("media_assets", mediaId);
  if (!media) throw new HttpError(404, "MEDIA_NOT_FOUND", "We couldn't find that video.");
  const course = await requireCourse(media.courseId);
  if (!await canAccessLesson(course, media.lessonId, user)) throw new HttpError(user ? 403 : 401, user ? "FORBIDDEN" : "UNAUTHENTICATED", "Enroll in this course to watch the lesson.");
  return { media, course };
}

mediaRouter.get("/media/:mediaId", optionalAuthenticate, asyncRoute(async (req, res) => {
  const { media } = await authorizeMedia(pathParam(req, "mediaId"), req.user);
  res.json({ media: { id: media.id, lessonId: media.lessonId, status: media.status, progress: media.progress, metadata: media.metadata, failureReason: req.user?.id === media.ownerId ? media.failureReason : undefined, updatedAt: media.completedAt ?? media.createdAt } });
}));

mediaRouter.get("/media/:mediaId/playlist", optionalAuthenticate, asyncRoute(async (req, res) => {
  const { media } = await authorizeMedia(pathParam(req, "mediaId"), req.user);
  if (media.status !== "READY") throw new HttpError(409, "MEDIA_NOT_READY", "This video is still processing.");
  let manifest: string;
  if (media.manifestKey) manifest = await readObjectText(media.manifestKey);
  else if (media.manifestPath) manifest = await fs.readFile(media.manifestPath, "utf8");
  else throw new HttpError(404, "MANIFEST_MISSING", "The video playlist is unavailable.");
  const lines = await Promise.all(manifest.split(/\r?\n/).map(async (line) => {
    if (!line || line.startsWith("#")) return line;
    const name = path.posix.basename(line.trim());
    if (!/^segment_\d{3,}\.ts$/.test(name)) throw new HttpError(500, "INVALID_MANIFEST", "The video playlist references an invalid asset.");
    if (media.manifestKey) return playbackAssetUrl(`${media.outputPrefix}/${name}`);
    return `${req.protocol}://${req.get("host")}/api/v1/media/${media.id}/assets/${encodeURIComponent(name)}`;
  }));
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Cache-Control", "private, no-store");
  res.send(lines.join("\n"));
}));

mediaRouter.get("/media/:mediaId/assets/:assetName", optionalAuthenticate, asyncRoute(async (req, res) => {
  const { media } = await authorizeMedia(pathParam(req, "mediaId"), req.user);
  if (media.status !== "READY") throw new HttpError(409, "MEDIA_NOT_READY", "This video is still processing.");
  const assetName = path.posix.basename(pathParam(req, "assetName"));
  const allowed = assetName === "thumbnail.jpg" || /^segment_\d{3,}\.ts$/.test(assetName);
  if (!allowed) throw new HttpError(404, "MEDIA_ASSET_NOT_FOUND", "We couldn't find that video segment.");
  if (media.outputPrefix && remoteMediaEnabled()) { res.redirect(302, await playbackAssetUrl(`${media.outputPrefix}/${assetName}`)); return; }
  const assetPath = path.join(config.mediaRoot, "work", media.id, "hls", assetName);
  // The worker cleans its temp directory after processing, so local output uses a stable persisted directory.
  const persistentPath = path.join(config.mediaRoot, "processed", media.id, assetName);
  try { await fs.access(persistentPath); }
  catch { await fs.access(assetPath).catch(() => { throw new HttpError(404, "MEDIA_ASSET_NOT_FOUND", "That video segment has expired."); }); }
  const filePath = await fs.access(persistentPath).then(() => persistentPath).catch(() => assetPath);
  res.setHeader("Content-Type", assetName.endsWith(".ts") ? "video/mp2t" : "image/jpeg");
  res.setHeader("Cache-Control", "private, max-age=60");
  res.sendFile(filePath);
}));
