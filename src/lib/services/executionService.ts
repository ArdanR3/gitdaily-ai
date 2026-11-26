import { prisma } from "@/lib/prisma";
import { validateFilesForCommit } from "@/lib/dailyGuard";
import { createRepositoryWithFiles, pushFilesToExistingRepo } from "@/lib/services/githubService";
import { sendExecutionResultNotification } from "@/lib/services/notificationService";
import { getTodayWibKey } from "@/lib/time";
import type { GeneratedFile, TriggerSource } from "@/types";

export async function executeSuggestionById(suggestionId: number, triggeredBy: TriggerSource) {
  const todayKey = getTodayWibKey();

  // Atomically check daily limit, claim DailySuggestion (PENDING -> EXECUTING), and acquire DailyExecutionLock
  const suggestion = await prisma.$transaction(async (tx) => {
    const existingSuccess = await tx.activityLog.findFirst({
      where: { dateKey: todayKey, status: "SUCCESS" },
      select: { id: true },
    });
    if (existingSuccess) {
      throw new Error(`Batas harian tercapai: sudah ada eksekusi sukses untuk tanggal ${todayKey} (WIB).`);
    }

    const found = await tx.dailySuggestion.findUnique({ where: { id: suggestionId } });
    if (!found) {
      throw new Error("Saran tidak ditemukan.");
    }
    if (found.status !== "PENDING") {
      throw new Error(`Saran ini tidak berstatus PENDING (status saat ini: ${found.status}).`);
    }

    const claimed = await tx.dailySuggestion.updateMany({
      where: { id: suggestionId, status: "PENDING" },
      data: { status: "EXECUTING" },
    });
    if (claimed.count !== 1) {
      throw new Error("Saran sedang diproses atau sudah dieksekusi.");
    }

    try {
      await tx.dailyExecutionLock.create({
        data: { dateKey: todayKey, source: triggeredBy },
      });
    } catch {
      throw new Error(`Eksekusi lain sedang berjalan atau sudah terkunci untuk tanggal ${todayKey} (WIB).`);
    }

    return found;
  });

  try {
    let files: GeneratedFile[] = [];
    try {
      files = JSON.parse(suggestion.filesJson) as GeneratedFile[];
    } catch {
      throw new Error("Data file pada saran rusak (invalid JSON).");
    }

    const validatedFiles = validateFilesForCommit(files);
    let pushResult;

    if (suggestion.type === "CREATE_REPO") {
      pushResult = await createRepositoryWithFiles(
        suggestion.targetRepo,
        suggestion.description || suggestion.reasoning.slice(0, 140),
        suggestion.visibility === "private",
        suggestion.title,
        validatedFiles
      );
    } else {
      const repoRecord = await prisma.repository.findUnique({
        where: { name: suggestion.targetRepo },
      });

      if (!repoRecord) {
        throw new Error(`Repository "${suggestion.targetRepo}" belum tersinkronisasi di database.`);
      }
      if (repoRecord.isPrivate) {
        throw new Error(
          `Diblokir oleh Security Guard: repository "${suggestion.targetRepo}" berstatus Private dan dikunci permanen.`
        );
      }
      if (repoRecord.isProtected) {
        throw new Error(
          `Repository "${suggestion.targetRepo}" berstatus Protected (${repoRecord.protectionReason || "dilindungi"}). Eksekusi diblokir.`
        );
      }

      pushResult = await pushFilesToExistingRepo(
        repoRecord.name,
        repoRecord.defaultBranch || "main",
        suggestion.title,
        validatedFiles
      );
    }

    await prisma.dailySuggestion.update({
      where: { id: suggestion.id },
      data: { status: "EXECUTED", executedAt: new Date() },
    });

    // Skip remaining pending suggestions for today so only 1 execution happens per day
    await prisma.dailySuggestion.updateMany({
      where: {
        dateKey: suggestion.dateKey,
        id: { not: suggestion.id },
        status: "PENDING",
      },
      data: { status: "SKIPPED" },
    });

    const log = await prisma.activityLog.create({
      data: {
        dateKey: todayKey,
        actionType: suggestion.type,
        repoName: pushResult.repo,
        commitMessage: suggestion.title,
        commitSha: pushResult.commitSha,
        commitUrl: pushResult.commitUrl,
        triggeredBy,
        status: "SUCCESS",
      },
    });

    try {
      await sendExecutionResultNotification({
        success: true,
        repoName: pushResult.repo,
        actionType: suggestion.type,
        commitMessage: suggestion.title,
        commitUrl: pushResult.commitUrl,
        triggeredBy,
      });
    } catch {
      // Do not fail the GitHub push response if notification channel is unconfigured
    }

    return { pushResult, log };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.dailySuggestion.update({
      where: { id: suggestion.id },
      data: { status: "FAILED" },
    });

    // Release today's execution lock on failure so the operator can retry with another suggestion
    await prisma.dailyExecutionLock.deleteMany({
      where: { dateKey: todayKey },
    });

    await prisma.activityLog.create({
      data: {
        dateKey: todayKey,
        actionType: suggestion.type,
        repoName: suggestion.targetRepo,
        commitMessage: suggestion.title,
        triggeredBy,
        status: "FAILED",
        errorMessage,
      },
    });

    try {
      await sendExecutionResultNotification({
        success: false,
        repoName: suggestion.targetRepo,
        actionType: suggestion.type,
        commitMessage: suggestion.title,
        triggeredBy,
        errorMessage,
      });
    } catch {
      // Ignore notification failure
    }

    throw new Error(errorMessage);
  }
}
