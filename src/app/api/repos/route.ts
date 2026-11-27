import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeApiError } from "@/lib/apiError";

export async function GET() {
  try {
    const repositories = await prisma.repository.findMany({
      orderBy: [{ isProtected: "asc" }, { lastSyncedAt: "desc" }],
    });
    return NextResponse.json({ repositories });
  } catch (error) {
    return safeApiError(error, "Gagal memuat daftar repository.", 500);
  }
}
