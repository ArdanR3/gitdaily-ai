import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeApiError } from "@/lib/apiError";

export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return safeApiError(error, "Gagal memuat activity log.", 500);
  }
}
