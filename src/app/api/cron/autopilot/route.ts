import { NextResponse } from "next/server";
import { verifyCronAuthorization } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasExecutedToday } from "@/lib/dailyGuard";
import { generateDailySuggestions } from "@/lib/services/aiSuggestionService";
import { executeSuggestionById } from "@/lib/services/executionService";
import { getTodayWibKey } from "@/lib/time";

async function handleAutopilotCron(request: Request) {
  if (!verifyCronAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Forbidden: invalid CRON_SECRET." }, { status: 401 });
  }

  try {
    const dateKey = getTodayWibKey();
    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    if (settings.mode !== "AUTOPILOT") {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Mode saat ini APPROVAL — Auto-Pilot dilewati.",
      });
    }

    if (await hasExecutedToday(dateKey)) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `Aktivitas sukses sudah tercatat untuk ${dateKey} (WIB).`,
      });
    }

    let pending = await prisma.dailySuggestion.findMany({
      where: { dateKey, status: "PENDING" },
      orderBy: { id: "asc" },
    });

    if (pending.length === 0) {
      pending = await generateDailySuggestions(dateKey);
    }

    // Prefer safest UPDATE_REPO on an allowed repo; fallback to CREATE_REPO
    const allowedRepoNames = new Set(
      (await prisma.repository.findMany({ where: { isProtected: false, isPrivate: false }, select: { name: true } })).map(
        (r) => r.name
      )
    );

    const chosen =
      pending.find((s) => s.type === "UPDATE_REPO" && allowedRepoNames.has(s.targetRepo)) ??
      pending.find((s) => s.type === "CREATE_REPO");

    if (!chosen) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Tidak ada saran aman yang memenuhi syarat untuk Auto-Pilot.",
      });
    }

    const result = await executeSuggestionById(chosen.id, "AUTOPILOT");
    return NextResponse.json({
      ok: true,
      skipped: false,
      dateKey,
      executedSuggestionId: chosen.id,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron autopilot gagal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleAutopilotCron(request);
}

export async function GET(request: Request) {
  return handleAutopilotCron(request);
}
