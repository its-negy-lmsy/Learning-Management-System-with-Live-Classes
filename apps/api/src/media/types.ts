export type MediaState = "UPLOADED" | "QUEUED" | "PROCESSING" | "READY" | "FAILED";
export interface MediaRecord {
  id: string;
  lessonId: string;
  courseId: string;
  ownerId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sourcePath?: string;
  sourceKey?: string;
  outputPrefix?: string;
  manifestPath?: string;
  manifestKey?: string;
  thumbnailPath?: string;
  thumbnailKey?: string;
  status: MediaState;
  progress: number;
  metadata?: { durationSeconds?: number; width?: number; height?: number; videoCodec?: string; audioCodec?: string; format?: string };
  failureReason?: string;
  createdAt: string;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
}
