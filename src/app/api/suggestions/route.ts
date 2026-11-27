import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasExecutedToday } from "@/lib/dailyGuard";
import { getTodayWibKey } from "@/lib/time";
import { safeApiError } from "@/lib/apiError";

export async function GET() {
  try {
    const dateKey = getTodayWibKey();
    const [suggestions, executedToday] = await Promise.all([
      prisma.dailySuggestion.findMany({
        where: { dateKey, status: { not: "SKIPPED" } },
        orderBy: { id: "asc" },
      }),
      hasExecutedToday(dateKey),
    ]);

    return NextResponse.json({
      dateKey,
      executedToday,
      suggestions,
    });
  } catch (error) {
    return safeApiError(error, "Gagal memuat saran harian.", 500);
  }
}
