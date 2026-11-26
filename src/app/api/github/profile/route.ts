import { NextResponse } from "next/server";
import { fetchGitHubProfile } from "@/lib/services/githubService";
import { prisma } from "@/lib/prisma";
import { hasExecutedToday } from "@/lib/dailyGuard";
import { getNextScheduleInfo, getTodayWibKey } from "@/lib/time";

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
    const [profile, executedToday, settings, successLogs] = await Promise.all([
      fetchGitHubProfile(),
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

    const streak = calculateStreak(successLogs.map((l) => l.dateKey));
    const nextSchedule = getNextScheduleInfo(
      executedToday ? settings.morningCronTime : settings.mode === "AUTOPILOT" ? settings.autopilotCronTime : settings.morningCronTime
    );

    return NextResponse.json({
      profile,
      todayKey,
      statusToday: executedToday ? "DONE" : "PENDING",
      streak,
      mode: settings.mode,
      nextSchedule,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat profil GitHub.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
