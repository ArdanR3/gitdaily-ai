import { getAppUrl, getGitHubUsername } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { NotificationChannel } from "@/types";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendTelegram(htmlText: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diatur.");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: htmlText,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Telegram API ${res.status}]`, body.slice(0, 400));
    throw new Error(`Telegram API gagal merespons (HTTP ${res.status}).`);
  }
}

async function sendDiscord(content: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL belum diatur.");
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Discord Webhook ${res.status}]`, body.slice(0, 400));
    throw new Error(`Discord Webhook gagal merespons (HTTP ${res.status}).`);
  }
}

async function getActiveChannel(): Promise<NotificationChannel> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  return (settings?.notificationChannel || "TELEGRAM") as NotificationChannel;
}

export async function dispatchNotification(
  telegramHtml: string,
  discordMarkdown: string,
  overrideChannel?: NotificationChannel
): Promise<void> {
  const channel = overrideChannel ?? (await getActiveChannel());
  if (channel === "NONE") return;

  if (channel === "TELEGRAM") {
    await sendTelegram(telegramHtml);
  } else if (channel === "DISCORD") {
    await sendDiscord(discordMarkdown);
  }
}

export async function sendDailySuggestionsNotification(
  suggestions: Array<{ type: string; targetRepo: string; title: string; reasoning: string }>
): Promise<void> {
  const username = getGitHubUsername();
  const appUrl = getAppUrl();

  const htmlLines = suggestions.map(
    (s, idx) =>
      `${idx + 1}. <b>${s.type === "CREATE_REPO" ? "Repo Baru" : "Update Repo"}</b>: <code>${escapeHtml(s.targetRepo)}</code>\n   • ${escapeHtml(s.title)}\n   • <i>${escapeHtml(s.reasoning)}</i>`
  );
  const telegramHtml = [
    `🤖 <b>GitDaily AI — Saran Harian untuk ${escapeHtml(username)}</b>`,
    "",
    ...htmlLines,
    "",
    `👉 Review &amp; Approve di Dashboard: ${escapeHtml(appUrl)}`,
  ].join("\n");

  const mdLines = suggestions.map(
    (s, idx) =>
      `${idx + 1}. **${s.type === "CREATE_REPO" ? "Repo Baru" : "Update Repo"}**: \`${s.targetRepo}\`\n   • ${s.title}\n   • _${s.reasoning}_`
  );
  const discordMd = [
    `🤖 **GitDaily AI — Saran Harian untuk ${username}**`,
    "",
    ...mdLines,
    "",
    `👉 Review & Approve di Dashboard: ${appUrl}`,
  ].join("\n");

  await dispatchNotification(telegramHtml, discordMd);
}

export async function sendExecutionResultNotification(params: {
  success: boolean;
  repoName: string;
  actionType: string;
  commitMessage: string;
  commitUrl?: string;
  prUrl?: string;
  triggeredBy: string;
  errorMessage?: string;
}): Promise<void> {
  const username = getGitHubUsername();
  const statusIcon = params.success ? "✅" : "❌";
  const statusLabel = params.success ? "Push Berhasil" : "Push Gagal";

  const htmlLines = [
    `${statusIcon} <b>GitDaily AI — ${statusLabel} (${escapeHtml(params.triggeredBy)})</b>`,
    `• Akun: <code>${escapeHtml(username)}</code>`,
    `• Repo: <code>${escapeHtml(params.repoName)}</code> (${escapeHtml(params.actionType)})`,
    `• Commit: <code>${escapeHtml(params.commitMessage)}</code>`,
  ];
  if (params.prUrl) htmlLines.push(`• Pull Request: ${escapeHtml(params.prUrl)}`);
  if (params.commitUrl) htmlLines.push(`• Link Commit: ${escapeHtml(params.commitUrl)}`);
  if (params.errorMessage) htmlLines.push(`• Error: ${escapeHtml(params.errorMessage)}`);

  const mdLines = [
    `${statusIcon} **GitDaily AI — ${statusLabel} (${params.triggeredBy})**`,
    `• Akun: \`${username}\``,
    `• Repo: \`${params.repoName}\` (${params.actionType})`,
    `• Commit: \`${params.commitMessage}\``,
  ];
  if (params.prUrl) mdLines.push(`• Pull Request: ${params.prUrl}`);
  if (params.commitUrl) mdLines.push(`• Link Commit: ${params.commitUrl}`);
  if (params.errorMessage) mdLines.push(`• Error: ${params.errorMessage}`);

  await dispatchNotification(htmlLines.join("\n"), mdLines.join("\n"));
}

export async function sendTestNotification(channel?: NotificationChannel): Promise<void> {
  const username = getGitHubUsername();
  const appUrl = getAppUrl();
  const telegramHtml = `🔔 <b>Test Notification — GitDaily AI</b>\nIntegrasi notifikasi untuk akun GitHub <code>${escapeHtml(username)}</code> berfungsi normal!\nDashboard: ${escapeHtml(appUrl)}`;
  const discordMd = `🔔 **Test Notification — GitDaily AI**\nIntegrasi notifikasi untuk akun GitHub \`${username}\` berfungsi normal!\nDashboard: ${appUrl}`;
  await dispatchNotification(telegramHtml, discordMd, channel);
}
