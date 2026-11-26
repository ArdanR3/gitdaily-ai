import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat pengaturan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "APPROVAL" | "AUTOPILOT";
      morningCronTime?: string;
      autopilotCronTime?: string;
      techPreferences?: string[];
      notificationChannel?: "TELEGRAM" | "DISCORD" | "NONE";
    };

    const data: Record<string, string> = {};
    if (body.mode === "APPROVAL" || body.mode === "AUTOPILOT") data.mode = body.mode;
    if (body.morningCronTime && /^\d{2}:\d{2}$/.test(body.morningCronTime)) {
      data.morningCronTime = body.morningCronTime;
    }
    if (body.autopilotCronTime && /^\d{2}:\d{2}$/.test(body.autopilotCronTime)) {
      data.autopilotCronTime = body.autopilotCronTime;
    }
    if (Array.isArray(body.techPreferences)) {
      data.techPreferences = JSON.stringify(body.techPreferences.map((t) => t.trim()).filter(Boolean));
    }
    if (
      body.notificationChannel === "TELEGRAM" ||
      body.notificationChannel === "DISCORD" ||
      body.notificationChannel === "NONE"
    ) {
      data.notificationChannel = body.notificationChannel;
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan pengaturan.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
