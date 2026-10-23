import { describe, expect, it } from "vitest";
import { assertMediaTransition, canTransitionMedia } from "./media-state.js";

describe("media processing lifecycle", () => {
  it("accepts upload, queue, processing, and ready transitions", () => {
    expect(assertMediaTransition("UPLOADED", "QUEUED")).toBe("QUEUED");
    expect(canTransitionMedia("QUEUED", "PROCESSING")).toBe(true);
    expect(canTransitionMedia("PROCESSING", "READY")).toBe(true);
  });
  it("allows retry after failure and prevents reopening ready media", () => {
    expect(canTransitionMedia("FAILED", "PROCESSING")).toBe(true);
    expect(canTransitionMedia("READY", "PROCESSING")).toBe(false);
    expect(() => assertMediaTransition("READY", "PROCESSING")).toThrow("Invalid media lifecycle transition");
  });
});
