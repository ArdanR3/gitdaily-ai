import { prisma } from "@/lib/prisma";
import { hasExecutedToday, validateFilesForCommit } from "@/lib/dailyGuard";
import { createRepositoryWithFiles, pushFilesToExistingRepo } from "@/lib/services/githubService";
import { sendExecutionResultNotification } from "@/lib/services/notificationService";
import { getTodayWibKey } from "@/lib/time";
import type { GeneratedFile, TriggerSource } from "@/types";

export async function executeSuggestionById(suggestionId: number, triggeredBy: TriggerSource) {
  const todayKey = getTodayWibKey();

  const alreadyDone = await hasExecutedToday(todayKey);
  if (alreadyDone) {
    throw new Error(`Batas harian tercapai: sudah ada eksekusi sukses untuk tanggal ${todayKey} (WIB).`);
  }

  const suggestion = await prisma.dailySuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    throw new Error("Saran tidak ditemukan.");
  }

  if (suggestion.status === "EXECUTED") {
    throw new Error("Saran ini sudah pernah dieksekusi.");
  }

  let files: GeneratedFile[] = [];
  try {
    files = JSON.parse(suggestion.filesJson) as GeneratedFile[];
  } catch {
    throw new Error("Data file pada saran rusak (invalid JSON).");
  }

  const validatedFiles = validateFilesForCommit(files);

  try {
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
