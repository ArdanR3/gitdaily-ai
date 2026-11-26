import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFilesForCommit } from "@/lib/dailyGuard";
import type { GeneratedFile } from "@/types";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const suggestionId = Number.parseInt(id, 10);
    if (Number.isNaN(suggestionId)) {
      return NextResponse.json({ error: "ID saran tidak valid." }, { status: 400 });
    }

    const existing = await prisma.dailySuggestion.findUnique({ where: { id: suggestionId } });
    if (!existing) {
      return NextResponse.json({ error: "Saran tidak ditemukan." }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Hanya saran berstatus PENDING yang dapat diedit." }, { status: 409 });
    }

    const body = (await request.json()) as {
      targetRepo?: string;
      visibility?: "public" | "private";
      title?: string;
      description?: string;
      files?: GeneratedFile[];
    };

    const data: Record<string, string> = {};
    if (body.targetRepo?.trim()) data.targetRepo = body.targetRepo.trim();
    if (body.visibility === "public" || body.visibility === "private") data.visibility = body.visibility;
    if (body.title?.trim()) data.title = body.title.trim();
    if (typeof body.description === "string") data.description = body.description.trim();
    if (body.files) {
      const validated = validateFilesForCommit(body.files);
      data.filesJson = JSON.stringify(validated);
    }

    const updated = await prisma.dailySuggestion.update({
      where: { id: suggestionId },
      data,
    });

    return NextResponse.json({ ok: true, suggestion: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan perubahan saran.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
