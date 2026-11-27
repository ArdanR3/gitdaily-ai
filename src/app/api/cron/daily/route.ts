import { NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/auth";
import { safeApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";
import { syncRepositoriesFromGitHub } from "@/lib/services/githubService";
import { generateDailySuggestions } from "@/lib/services/aiSuggestionService";
import { sendDailySuggestionsNotification } from "@/lib/services/notificationService";
import { getTodayWibKey } from "@/lib/time";

export async function POST(request: Request) {
  if (!(await verifyCronAuthorization(request.headers.get("authorization")))) {
    return NextResponse.json({ error: "Forbidden: invalid CRON_SECRET." }, { status: 401 });
  }

  const dateKey = getTodayWibKey();
  let lockAcquired = false;

  try {
    // Idempotency check + atomic lock to prevent concurrent daily cron AI/chunk races
    const existingCount = await prisma.dailySuggestion.count({
      where: { dateKey, status: { in: ["PENDING", "EXECUTING", "EXECUTED"] } },
    });

    if (existingCount > 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Saran untuk tanggal ${dateKey} (WIB) sudah tersedia (${existingCount} item).`,
      });
    }

    try {
      await prisma.dailyCronLock.create({ data: { dateKey } });
      lockAcquired = true;
    } catch {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Cron daily untuk ${dateKey} (WIB) sudah berjalan atau selesai.`,
      });
    }

    const repos = await syncRepositoriesFromGitHub();
    const suggestions = await generateDailySuggestions(dateKey);

    try {
      await sendDailySuggestionsNotification(suggestions);
    } catch {
      // Do not fail cron if notification webhook is not configured yet
    }

    return NextResponse.json({
      ok: true,
      skipped: false,
      dateKey,
      syncedRepos: repos.length,
      generatedSuggestions: suggestions.length,
    });
  } catch (error) {
    if (lockAcquired) {
      await prisma.dailyCronLock.deleteMany({ where: { dateKey } }).catch(() => {});
    }
    return safeApiError(error, "Cron daily gagal.", 500, { exposeDomainMessage: true });
  }
}
