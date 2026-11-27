import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFilesForCommit } from "@/lib/dailyGuard";
import { safeApiError } from "@/lib/apiError";
import type { GeneratedFile } from "@/types";

const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]{1,100}$/;

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

    if (typeof body.targetRepo === "string" && body.targetRepo.trim()) {
      const targetRepo = body.targetRepo.trim();
      if (!REPO_NAME_REGEX.test(targetRepo) || targetRepo === "." || targetRepo === "..") {
        return NextResponse.json(
          { error: "Nama repository hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung (1-100 karakter)." },
          { status: 400 }
        );
      }

      if (existing.type === "UPDATE_REPO") {
        const repoRecord = await prisma.repository.findUnique({ where: { name: targetRepo } });
        if (!repoRecord) {
          return NextResponse.json({ error: `Repository "${targetRepo}" tidak ditemukan di daftar sinkronisasi.` }, { status: 404 });
        }
        if (repoRecord.isPrivate || repoRecord.isProtected) {
          return NextResponse.json(
            { error: `Diblokir oleh Security Guard: repository "${targetRepo}" berstatus Private/Protected.` },
            { status: 403 }
          );
        }
      }

      data.targetRepo = targetRepo;
    }

    if (body.visibility === "public" || body.visibility === "private") data.visibility = body.visibility;
    if (typeof body.title === "string" && body.title.trim()) {
      const title = body.title.trim();
      if (title.length > 160) {
        return NextResponse.json({ error: "Judul commit maksimal 160 karakter." }, { status: 400 });
      }
      data.title = title;
    }
    if (typeof body.description === "string") {
      data.description = body.description.trim().slice(0, 500);
    }
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
    return safeApiError(error, "Gagal menyimpan perubahan saran.", 400, { exposeDomainMessage: true });
  }
}
