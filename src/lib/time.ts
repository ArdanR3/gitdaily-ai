import { getTimezone } from "./env";

/**
 * Returns YYYY-MM-DD string in Asia/Jakarta (WIB) timezone.
 */
export function getTodayWibKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Computes human-readable countdown to the next HH:mm occurrence in WIB (UTC+7).
 */
export function getNextScheduleInfo(targetHHmm: string): {
  targetTimeWib: string;
  remainingMinutes: number;
  label: string;
} {
  const [hourStr, minStr] = targetHHmm.split(":");
  const targetHour = Number.parseInt(hourStr || "8", 10);
  const targetMin = Number.parseInt(minStr || "0", 10);

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: getTimezone(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const curHour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const curMin = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  const nowTotal = curHour * 60 + curMin;
  const targetTotal = targetHour * 60 + targetMin;
  const diff = targetTotal > nowTotal ? targetTotal - nowTotal : 24 * 60 - nowTotal + targetTotal;

  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return {
    targetTimeWib: `${String(targetHour).padStart(2, "0")}:${String(targetMin).padStart(2, "0")} WIB`,
    remainingMinutes: diff,
    label: `${h}j ${m}m`,
  };
}
