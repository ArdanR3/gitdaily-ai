import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const repositories = await prisma.repository.findMany({
      orderBy: [{ isProtected: "asc" }, { lastSyncedAt: "desc" }],
    });
    return NextResponse.json({ repositories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memuat daftar repository.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
