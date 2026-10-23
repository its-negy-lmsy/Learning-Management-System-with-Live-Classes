export type MediaLifecycle = "UPLOADED" | "QUEUED" | "PROCESSING" | "READY" | "FAILED";
const transitions: Record<MediaLifecycle, MediaLifecycle[]> = {
  UPLOADED: ["QUEUED", "FAILED"],
  QUEUED: ["PROCESSING", "FAILED"],
  PROCESSING: ["PROCESSING", "READY", "FAILED"],
  READY: [],
  FAILED: ["PROCESSING", "QUEUED"],
};

export function canTransitionMedia(from: MediaLifecycle, to: MediaLifecycle) {
  return from === to || transitions[from].includes(to);
}

export function assertMediaTransition(from: MediaLifecycle, to: MediaLifecycle) {
  if (!canTransitionMedia(from, to)) throw new Error(`Invalid media lifecycle transition: ${from} -> ${to}`);
  return to;
}
