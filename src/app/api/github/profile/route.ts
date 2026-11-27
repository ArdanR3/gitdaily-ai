import { NextResponse } from "next/server";
import { fetchGitHubProfile } from "@/lib/services/githubService";
import { prisma } from "@/lib/prisma";
import { hasExecutedToday } from "@/lib/dailyGuard";
import { getNextScheduleInfo, getTodayWibKey } from "@/lib/time";
import { getGitHubUsername } from "@/lib/env";
import { safeApiError } from "@/lib/apiError";
import type { GitHubProfileSummary } from "@/types";

function calculateStreak(dateKeys: string[]): number {
  const uniqueDates = new Set(dateKeys);
  if (uniqueDates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  let key = getTodayWibKey(cursor);

  // If today hasn't been pushed yet, start counting from yesterday
  if (!uniqueDates.has(key)) {
    cursor.setDate(cursor.getDate() - 1);
    key = getTodayWibKey(cursor);
  }

  while (uniqueDates.has(key)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
    key = getTodayWibKey(cursor);
  }

  return streak;
}

export async function GET() {
  try {
    const todayKey = getTodayWibKey();
    const username = getGitHubUsername();

    const [profileResult, executedToday, settings, successLogs] = await Promise.all([
      fetchGitHubProfile().catch((err: unknown): { fallback: GitHubProfileSummary; error: string } => ({
        fallback: {
          username,
          name: username,
          avatarUrl: `https://github.com/${username}.png`,
          profileUrl: `https://github.com/${username}`,
          bio: null,
          publicRepos: 0,
          totalPrivateRepos: 0,
        },
        error: err instanceof Error ? err.message : "Gagal memuat profil GitHub.",
      })),
      hasExecutedToday(todayKey),
      prisma.appSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
      }),
      prisma.activityLog.findMany({
        where: { status: "SUCCESS" },
        select: { dateKey: true },
        orderBy: { dateKey: "desc" },
        take: 120,
      }),
    ]);

    const profile = "fallback" in profileResult ? profileResult.fallback : profileResult;
    const profileError = "error" in profileResult ? profileResult.error : null;

    const streak = calculateStreak(successLogs.map((l) => l.dateKey));
    const nextSchedule = getNextScheduleInfo(
      executedToday ? settings.morningCronTime : settings.mode === "AUTOPILOT" ? settings.autopilotCronTime : settings.morningCronTime
    );

    return NextResponse.json({
      profile,
      profileError,
      todayKey,
      statusToday: executedToday ? "DONE" : "PENDING",
      streak,
      mode: settings.mode,
      nextSchedule,
    });
  } catch (error) {
    return safeApiError(error, "Gagal memuat profil GitHub.", 500);
  }
}
