import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, verifyDashboardPassword } from "@/lib/auth";
import { getDashboardPassword } from "@/lib/env";
import { computeNextFailedAttempt, evaluateLoginLockout } from "@/lib/loginRateLimit";
import { prisma } from "@/lib/prisma";

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

    const lockState = evaluateLoginLockout(record, now);
    if (lockState.locked) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(lockState.retryAfterSec / 60)} menit.` },
        { status: 429, headers: { "Retry-After": String(lockState.retryAfterSec) } }
      );
    }

    const valid = typeof body.password === "string" && (await verifyDashboardPassword(body.password));

    if (!valid) {
      const nextAttempt = computeNextFailedAttempt(record, now);

      await prisma.loginAttempt
        .upsert({
          where: { ip },
          update: nextAttempt,
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
