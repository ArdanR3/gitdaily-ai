import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasExecutedToday } from "@/lib/dailyGuard";
import { getTodayWibKey } from "@/lib/time";

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
    const message = error instanceof Error ? error.message : "Gagal memuat saran harian.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
