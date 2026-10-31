import { describe, expect, it } from "vitest";

// Pure helper function modeling live class join authorization
export function evaluateLiveClassJoinEligibility({
  status,
  startsAt,
  endsAt,
  isInstructor,
  nowMs = Date.now(),
}: {
  status: string;
  startsAt: string;
  endsAt: string;
  isInstructor: boolean;
  nowMs?: number;
}): { allowed: boolean; reason?: string } {
  if (status === "CANCELLED") {
    return { allowed: false, reason: "SESSION_CANCELLED" };
  }
  if (status === "ENDED") {
    return { allowed: false, reason: "SESSION_ENDED" };
  }
  const startsAtMs = new Date(startsAt).getTime();
  const endsAtMs = new Date(endsAt).getTime();

  if (!isInstructor && status !== "LIVE") {
    if (nowMs < startsAtMs - 30 * 60_000) {
      return { allowed: false, reason: "SESSION_NOT_STARTED" };
    }
    if (nowMs > endsAtMs + 30 * 60_000) {
      return { allowed: false, reason: "SESSION_EXPIRED" };
    }
  }

  return { allowed: true };
}

describe("live class join eligibility rules", () => {
  const baseSession = {
    startsAt: "2026-10-31T14:00:00.000Z",
    endsAt: "2026-10-31T15:00:00.000Z",
  };
  const sessionStartMs = new Date(baseSession.startsAt).getTime();

  it("strictly rejects joining a CANCELLED class even during the time window", () => {
    const result = evaluateLiveClassJoinEligibility({
      ...baseSession,
      status: "CANCELLED",
      isInstructor: false,
      nowMs: sessionStartMs + 10 * 60_000,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("SESSION_CANCELLED");
  });

  it("strictly rejects joining an ENDED class", () => {
    const result = evaluateLiveClassJoinEligibility({
      ...baseSession,
      status: "ENDED",
      isInstructor: false,
      nowMs: sessionStartMs + 10 * 60_000,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("SESSION_ENDED");
  });

  it("prevents student from joining a scheduled class too early (>30 min before)", () => {
    const result = evaluateLiveClassJoinEligibility({
      ...baseSession,
      status: "SCHEDULED",
      isInstructor: false,
      nowMs: sessionStartMs - 45 * 60_000,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("SESSION_NOT_STARTED");
  });

  it("allows student to join within the 30 minute pre-session window", () => {
    const result = evaluateLiveClassJoinEligibility({
      ...baseSession,
      status: "SCHEDULED",
      isInstructor: false,
      nowMs: sessionStartMs - 15 * 60_000,
    });
    expect(result.allowed).toBe(true);
  });

  it("prevents student from joining an expired scheduled class (>30 min after endsAt)", () => {
    const endsAtMs = new Date(baseSession.endsAt).getTime();
    const result = evaluateLiveClassJoinEligibility({
      ...baseSession,
      status: "SCHEDULED",
      isInstructor: false,
      nowMs: endsAtMs + 45 * 60_000,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("SESSION_EXPIRED");
  });

  it("allows instructor to enter the studio room early to prepare", () => {
    const result = evaluateLiveClassJoinEligibility({
      ...baseSession,
      status: "SCHEDULED",
      isInstructor: true,
      nowMs: sessionStartMs - 60 * 60_000,
    });
    expect(result.allowed).toBe(true);
  });

  it("allows students to join anytime while session status is actively LIVE", () => {
    const result = evaluateLiveClassJoinEligibility({
      ...baseSession,
      status: "LIVE",
      isInstructor: false,
      nowMs: sessionStartMs + 20 * 60_000,
    });
    expect(result.allowed).toBe(true);
  });
});
