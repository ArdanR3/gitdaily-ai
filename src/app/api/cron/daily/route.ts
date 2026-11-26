import { NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncRepositoriesFromGitHub } from "@/lib/services/githubService";
import { generateDailySuggestions } from "@/lib/services/aiSuggestionService";
import { sendDailySuggestionsNotification } from "@/lib/services/notificationService";
import { getTodayWibKey } from "@/lib/time";

async function handleDailyCron(request: Request) {
  if (!verifyCronAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Forbidden: invalid CRON_SECRET." }, { status: 401 });
  }

  try {
    const dateKey = getTodayWibKey();

    // Idempotency check: skip Gemini API call if today's suggestions already exist
    const existingCount = await prisma.dailySuggestion.count({
      where: { dateKey, status: { in: ["PENDING", "EXECUTED"] } },
    });

    if (existingCount > 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Saran untuk tanggal ${dateKey} (WIB) sudah tersedia (${existingCount} item).`,
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
    const message = error instanceof Error ? error.message : "Cron daily gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleDailyCron(request);
}

export async function GET(request: Request) {
  return handleDailyCron(request);
}
