import { NextResponse } from "next/server";
import { sendTestNotification } from "@/lib/services/notificationService";
import { safeApiError } from "@/lib/apiError";
import type { NotificationChannel } from "@/types";

const ALLOWED_CHANNELS = new Set<NotificationChannel>(["TELEGRAM", "DISCORD", "NONE"]);

export async function POST(request: Request) {
  try {
    let channel: NotificationChannel | undefined;
    try {
      const body = (await request.json()) as { channel?: unknown };
      if (body.channel !== undefined) {
        if (typeof body.channel !== "string" || !ALLOWED_CHANNELS.has(body.channel as NotificationChannel)) {
          return NextResponse.json({ error: "Channel notifikasi tidak valid." }, { status: 400 });
        }
        channel = body.channel as NotificationChannel;
      }
    } catch {
      // Allow empty POST body to fall back to the saved channel in AppSettings.
    }

    await sendTestNotification(channel);
    return NextResponse.json({ ok: true, message: "Notifikasi uji coba berhasil dikirim." });
  } catch (error) {
    return safeApiError(error, "Gagal mengirim notifikasi uji coba.", 400, { exposeDomainMessage: true });
  }
}
