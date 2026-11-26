import { NextResponse } from "next/server";
import { sendTestNotification } from "@/lib/services/notificationService";
import type { NotificationChannel } from "@/types";

export async function POST(request: Request) {
  try {
    let channel: NotificationChannel | undefined;
    try {
      const body = (await request.json()) as { channel?: NotificationChannel };
      channel = body.channel;
    } catch {
      // Optional body
    }

    await sendTestNotification(channel);
    return NextResponse.json({ ok: true, message: "Notifikasi uji coba berhasil dikirim." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengirim notifikasi uji coba.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
