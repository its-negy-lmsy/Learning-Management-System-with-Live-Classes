import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { get, update } from "../db/store.js";
import type { CourseRecord } from "../routes/course-utils.js";
import { uploadFile, remoteMediaEnabled, downloadFile } from "./storage.js";
import type { MediaRecord } from "./types.js";
import { assertMediaTransition } from "../domain/media-state.js";

function run(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr = (stderr + chunk).slice(-6000); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} exited with ${code}: ${stderr.slice(-1000)}`)));
  });
}

async function publishTree(outputDir: string, prefix: string) {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const localPath = path.join(outputDir, entry.name);
    const contentType = entry.name.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : entry.name.endsWith(".ts") ? "video/mp2t" : "image/jpeg";
    await uploadFile(`${prefix}/${entry.name}`, localPath, contentType);
  }
}

export async function processMediaJob(mediaId: string) {
  const media = await get<MediaRecord>("media_assets", mediaId);
  if (!media) throw new Error("Media record no longer exists.");
  if (media.status === "READY") return media;
  assertMediaTransition(media.status, "PROCESSING");
  const workspace = path.join(config.mediaRoot, "work", media.id);
  const outputDir = path.join(workspace, "hls");
  const inputPath = path.join(workspace, "source.input");
  await fs.rm(workspace, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  try {
    await update<MediaRecord>("media_assets", media.id, { status: "PROCESSING", progress: 5, startedAt: new Date().toISOString(), failureReason: undefined });
    if (media.sourceKey) await downloadFile(media.sourceKey, inputPath);
    else if (media.sourcePath) await fs.copyFile(media.sourcePath, inputPath);
    else throw new Error("Source video is unavailable.");

    const probe = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", inputPath]);
    const probeData = JSON.parse(probe.stdout) as { format?: { format_name?: string; duration?: string }; streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number }> };
    const video = probeData.streams?.find((stream) => stream.codec_type === "video");
    if (!video) throw new Error("The uploaded file does not contain a video stream.");
    const durationSeconds = Number(probeData.format?.duration ?? 0);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 6 * 60 * 60) throw new Error("Video duration must be between 1 second and 6 hours.");
    const course = await get<CourseRecord>("courses", media.courseId);
    if (course) {
      for (const section of course.sections) for (const lesson of section.lessons) if (lesson.id === media.lessonId) lesson.durationSeconds = Math.ceil(durationSeconds);
      await update<CourseRecord>("courses", course.id, { sections: course.sections } as Partial<CourseRecord>);
    }
    await update<MediaRecord>("media_assets", media.id, { progress: 20, metadata: { durationSeconds, width: video.width, height: video.height, videoCodec: video.codec_name, format: probeData.format?.format_name } });

    const manifestPath = path.join(outputDir, "index.m3u8");
    const segmentPattern = path.join(outputDir, "segment_%03d.ts");
    await run("ffmpeg", ["-hide_banner", "-nostdin", "-y", "-i", inputPath, "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "25", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-f", "hls", "-hls_time", "4", "-hls_playlist_type", "vod", "-hls_segment_filename", segmentPattern, manifestPath]);
    const manifest = await fs.readFile(manifestPath, "utf8");
    const segments = (await fs.readdir(outputDir)).filter((name) => name.endsWith(".ts"));
    if (!manifest.includes("#EXTM3U") || segments.length === 0) throw new Error("FFmpeg did not produce a valid HLS playlist and media segments.");
    await update<MediaRecord>("media_assets", media.id, { progress: 80 });

    let thumbnailPath: string | undefined;
    try {
      thumbnailPath = path.join(outputDir, "thumbnail.jpg");
      await run("ffmpeg", ["-hide_banner", "-nostdin", "-y", "-ss", "1", "-i", inputPath, "-frames:v", "1", "-q:v", "2", thumbnailPath]);
      await fs.access(thumbnailPath);
    } catch { thumbnailPath = undefined; }

    const outputPrefix = `processed/${media.courseId}/${media.lessonId}/${media.id}`;
    const manifestKey = `${outputPrefix}/index.m3u8`;
    const thumbnailKey = thumbnailPath ? `${outputPrefix}/thumbnail.jpg` : undefined;
    let persistedManifestPath: string | undefined;
    let persistedThumbnailPath: string | undefined;
    if (remoteMediaEnabled()) await publishTree(outputDir, outputPrefix);
    else {
      const persistedDir = path.join(config.mediaRoot, "processed", media.id);
      await fs.rm(persistedDir, { recursive: true, force: true });
      await fs.mkdir(persistedDir, { recursive: true });
      for (const name of await fs.readdir(outputDir)) await fs.copyFile(path.join(outputDir, name), path.join(persistedDir, name));
      persistedManifestPath = path.join(persistedDir, "index.m3u8");
      persistedThumbnailPath = thumbnailPath ? path.join(persistedDir, "thumbnail.jpg") : undefined;
    }
    assertMediaTransition("PROCESSING", "READY");
    const finalMedia = await update<MediaRecord>("media_assets", media.id, {
      status: "READY", progress: 100, manifestPath: remoteMediaEnabled() ? undefined : persistedManifestPath,
      manifestKey: remoteMediaEnabled() ? manifestKey : undefined,
      outputPrefix: remoteMediaEnabled() ? outputPrefix : undefined,
      thumbnailPath: !remoteMediaEnabled() ? persistedThumbnailPath : undefined,
      thumbnailKey: remoteMediaEnabled() ? thumbnailKey : undefined,
      completedAt: new Date().toISOString(),
    });
    if (media.sourcePath) await fs.rm(media.sourcePath, { force: true }).catch(() => undefined);
    return finalMedia;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video processing failed.";
    assertMediaTransition("PROCESSING", "FAILED");
    await update<MediaRecord>("media_assets", media.id, { status: "FAILED", progress: 0, failureReason: message.slice(0, 500), completedAt: new Date().toISOString() });
    throw error;
  } finally {
    await fs.rm(workspace, { recursive: true, force: true }).catch(() => undefined);
    if (remoteMediaEnabled() && media.sourcePath) await fs.rm(media.sourcePath, { force: true }).catch(() => undefined);
  }
}
