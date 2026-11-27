export const MAX_FAILED_ATTEMPTS = 8;
export const WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_MS = 15 * 60 * 1000;

export interface LoginAttemptRecord {
  failedCount: number;
  windowStart: Date;
  lockedUntil: Date | null;
}

export function evaluateLoginLockout(
  record: LoginAttemptRecord | null,
  now: Date
): { locked: false } | { locked: true; retryAfterSec: number } {
  if (record?.lockedUntil && record.lockedUntil > now) {
    const retryAfterSec = Math.max(1, Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000));
    return { locked: true, retryAfterSec };
  }
  return { locked: false };
}

export function computeNextFailedAttempt(
  record: LoginAttemptRecord | null,
  now: Date
): { failedCount: number; windowStart: Date; lockedUntil: Date | null } {
  const windowExpired = !record || now.getTime() - record.windowStart.getTime() > WINDOW_MS;
  const failedCount = windowExpired ? 1 : record.failedCount + 1;
  const lockedUntil = failedCount >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_MS) : null;
  return {
    failedCount,
    windowStart: windowExpired ? now : record.windowStart,
    lockedUntil,
  };
}
