import { describe, expect, it } from "vitest";
import {
  computeNextFailedAttempt,
  evaluateLoginLockout,
  LOCKOUT_MS,
  MAX_FAILED_ATTEMPTS,
  WINDOW_MS,
} from "@/lib/loginRateLimit";

describe("loginRateLimit sliding window", () => {
  it("does not lock when no record exists or lockout has expired", () => {
    const now = new Date("2026-11-27T10:00:00Z");
    expect(evaluateLoginLockout(null, now)).toEqual({ locked: false });
    expect(
      evaluateLoginLockout(
        { failedCount: 8, windowStart: new Date(now.getTime() - 20 * 60_000), lockedUntil: new Date(now.getTime() - 1000) },
        now
      )
    ).toEqual({ locked: false });
  });

  it("returns locked with positive retryAfterSec while lockout is active", () => {
    const now = new Date("2026-11-27T10:00:00Z");
    const res = evaluateLoginLockout(
      { failedCount: 8, windowStart: now, lockedUntil: new Date(now.getTime() + 125_000) },
      now
    );
    expect(res).toEqual({ locked: true, retryAfterSec: 125 });
  });

  it("increments failedCount within window and triggers lockout on MAX_FAILED_ATTEMPTS", () => {
    const start = new Date("2026-11-27T10:00:00Z");
    let record = computeNextFailedAttempt(null, start);
    expect(record.failedCount).toBe(1);
    expect(record.lockedUntil).toBeNull();

    for (let i = 2; i < MAX_FAILED_ATTEMPTS; i++) {
      record = computeNextFailedAttempt(record, new Date(start.getTime() + i * 1000));
      expect(record.failedCount).toBe(i);
      expect(record.lockedUntil).toBeNull();
    }

    const triggerTime = new Date(start.getTime() + 60_000);
    const locked = computeNextFailedAttempt(record, triggerTime);
    expect(locked.failedCount).toBe(MAX_FAILED_ATTEMPTS);
    expect(locked.lockedUntil?.getTime()).toBe(triggerTime.getTime() + LOCKOUT_MS);
  });

  it("resets counter when previous window has expired", () => {
    const oldStart = new Date("2026-11-27T10:00:00Z");
    const afterWindow = new Date(oldStart.getTime() + WINDOW_MS + 1000);
    const next = computeNextFailedAttempt(
      { failedCount: 6, windowStart: oldStart, lockedUntil: null },
      afterWindow
    );
    expect(next.failedCount).toBe(1);
    expect(next.windowStart).toEqual(afterWindow);
    expect(next.lockedUntil).toBeNull();
  });
});
