import { getAppUrl, getGitHubUsername } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { NotificationChannel } from "@/types";

async function sendTelegram(text: string): Promise<void> {
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
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error (${res.status}): ${body}`);
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
    throw new Error(`Discord Webhook error (${res.status}): ${body}`);
  }
}

async function getActiveChannel(): Promise<NotificationChannel> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const channel = (settings?.notificationChannel || "TELEGRAM") as NotificationChannel;
  return channel;
}

export async function dispatchNotification(message: string, overrideChannel?: NotificationChannel): Promise<void> {
  const channel = overrideChannel ?? (await getActiveChannel());
  if (channel === "NONE") return;

  if (channel === "TELEGRAM") {
    await sendTelegram(message);
  } else if (channel === "DISCORD") {
    await sendDiscord(message);
  }
}

export async function sendDailySuggestionsNotification(
  suggestions: Array<{ type: string; targetRepo: string; title: string; reasoning: string }>
): Promise<void> {
  const username = getGitHubUsername();
  const appUrl = getAppUrl();
  const lines = suggestions.map(
    (s, idx) =>
      `${idx + 1}. *${s.type === "CREATE_REPO" ? "Repo Baru" : "Update Repo"}*: \`${s.targetRepo}\`\n   • ${s.title}\n   • _${s.reasoning}_`
  );

  const msg = [
    `🤖 *GitDaily AI — Saran Harian untuk ${username}*`,
    "",
    ...lines,
    "",
    `👉 Review & Approve di Dashboard: ${appUrl}`,
  ].join("\n");

  await dispatchNotification(msg);
}

export async function sendExecutionResultNotification(params: {
  success: boolean;
  repoName: string;
  actionType: string;
  commitMessage: string;
  commitUrl?: string;
  triggeredBy: string;
  errorMessage?: string;
}): Promise<void> {
  const username = getGitHubUsername();
  const statusIcon = params.success ? "✅" : "❌";
  const header = params.success
    ? `${statusIcon} *GitDaily AI — Push Berhasil (${params.triggeredBy})*`
    : `${statusIcon} *GitDaily AI — Push Gagal (${params.triggeredBy})*`;

  const lines = [
    header,
    `• Akun: \`${username}\``,
    `• Repo: \`${params.repoName}\` (${params.actionType})`,
    `• Commit: \`${params.commitMessage}\``,
  ];

  if (params.commitUrl) {
    lines.push(`• Link Commit: ${params.commitUrl}`);
  }
  if (params.errorMessage) {
    lines.push(`• Error: ${params.errorMessage}`);
  }

  await dispatchNotification(lines.join("\n"));
}

export async function sendTestNotification(channel?: NotificationChannel): Promise<void> {
  const username = getGitHubUsername();
  const appUrl = getAppUrl();
  await dispatchNotification(
    `🔔 *Test Notification — GitDaily AI*\nIntegrasi notifikasi untuk akun GitHub \`${username}\` berfungsi normal!\nDashboard: ${appUrl}`,
    channel
  );
}
