import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, verifyDashboardPassword } from "@/lib/auth";
import { getDashboardPassword } from "@/lib/env";

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

    if (!verifyDashboardPassword(body.password)) {
      return NextResponse.json({ error: "Password / PIN salah." }, { status: 401 });
    }

    const token = await createSessionToken(expected);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }
}
