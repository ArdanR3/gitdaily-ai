import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, verifyDashboardPassword } from "@/lib/auth";
import { getDashboardPassword } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const expected = getDashboardPassword();

    if (!expected) {
      return NextResponse.json(
        { error: "DASHBOARD_PASSWORD belum diatur di environment variable." },
        { status: 500 }
      );
    }

    const ip = extractClientIp(request);
    const now = new Date();
    const record = await prisma.loginAttempt.findUnique({ where: { ip } }).catch(() => null);

    if (record?.lockedUntil && record.lockedUntil > now) {
      const retryAfterSec = Math.max(1, Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000));
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(retryAfterSec / 60)} menit.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const valid = typeof body.password === "string" && (await verifyDashboardPassword(body.password));

    if (!valid) {
      const windowExpired = !record || now.getTime() - record.windowStart.getTime() > WINDOW_MS;
      const nextCount = windowExpired ? 1 : record.failedCount + 1;
      const lockedUntil = nextCount >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_MS) : null;

      await prisma.loginAttempt
        .upsert({
          where: { ip },
          update: {
            failedCount: nextCount,
            windowStart: windowExpired ? now : record.windowStart,
            lockedUntil,
          },
          create: {
            ip,
            failedCount: 1,
            windowStart: now,
            lockedUntil: null,
          },
        })
        .catch(() => {});

      return NextResponse.json({ error: "Password / PIN salah." }, { status: 401 });
    }

    if (record) {
      await prisma.loginAttempt.delete({ where: { ip } }).catch(() => {});
    }

    const token = await createSessionToken(expected);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }
}
