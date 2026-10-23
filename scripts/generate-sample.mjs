import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "storage", "samples");
const output = path.join(outputDir, "fs03-sample.mp4");
await fs.mkdir(outputDir, { recursive: true });
const args = [
  "-hide_banner", "-y", "-f", "lavfi", "-i", "color=c=0x315b4a:s=960x540:r=24:d=12",
  "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=44100:duration=12",
  "-vf", "drawbox=x=80:y=82:w=800:h=4:color=0xe9c6a7:t=fill,drawbox=x=80:y=130:w=640:h=2:color=0xf3f1e9:t=fill",
  "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", output,
];
const child = spawn("ffmpeg", args, { stdio: "inherit", windowsHide: true });
child.on("error", (error) => { console.error("Could not start FFmpeg. Install FFmpeg and ensure ffmpeg.exe is on PATH.", error.message); process.exitCode = 1; });
child.on("close", (code) => {
  if (code !== 0) { console.error(`FFmpeg exited with code ${code}.`); process.exitCode = code ?? 1; return; }
  console.info(`Generated 12-second test video at ${output}`);
});
