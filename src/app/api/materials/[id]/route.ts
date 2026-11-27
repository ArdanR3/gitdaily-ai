import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitIntoStudyChunks } from "@/lib/chunkText";
import { safeApiError } from "@/lib/apiError";

const MAX_TITLE_CHARS = 160;
const MAX_CONTENT_CHARS = 400_000;
const MAX_CHUNKS = 150;

const MATERIAL_SUMMARY_SELECT = {
  id: true,
  title: true,
  sourceType: true,
  totalChunks: true,
  currentChunkIndex: true,
  charCount: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const materialId = Number.parseInt(id, 10);
    if (Number.isNaN(materialId)) {
      return NextResponse.json({ error: "ID materi tidak valid." }, { status: 400 });
    }

    const material = await prisma.studyMaterial.findUnique({
      where: { id: materialId },
    });
    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    let content = "";
    try {
      const parsed = JSON.parse(material.chunksJson) as unknown;
      if (Array.isArray(parsed)) {
        content = parsed.filter((c): c is string => typeof c === "string").join("\n\n");
      }
    } catch {
      content = "";
    }

    return NextResponse.json({
      material: {
        id: material.id,
        title: material.title,
        sourceType: material.sourceType,
        totalChunks: material.totalChunks,
        currentChunkIndex: material.currentChunkIndex,
        charCount: material.charCount,
        isActive: material.isActive,
        createdAt: material.createdAt,
        content,
      },
    });
  } catch (error) {
    return safeApiError(error, "Gagal memuat detail materi.", 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const materialId = Number.parseInt(id, 10);
    if (Number.isNaN(materialId)) {
      return NextResponse.json({ error: "ID materi tidak valid." }, { status: 400 });
    }

    const existing = await prisma.studyMaterial.findUnique({
      where: { id: materialId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    const body = (await request.json()) as {
      isActive?: boolean;
      resetProgress?: boolean;
      title?: string;
      content?: string;
      currentChunkIndex?: number;
      currentChunk?: number;
    };

    const data: {
      isActive?: boolean;
      title?: string;
      chunksJson?: string;
      totalChunks?: number;
      charCount?: number;
      currentChunkIndex?: number;
    } = {};

    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Judul materi tidak boleh kosong." }, { status: 400 });
      }
      const cleanTitle = body.title.trim();
      if (cleanTitle.length > MAX_TITLE_CHARS) {
        return NextResponse.json(
          { error: `Judul materi maksimal ${MAX_TITLE_CHARS} karakter.` },
          { status: 400 }
        );
      }
      data.title = cleanTitle;
    }

    let nextTotalChunks = existing.totalChunks;

    if (body.content !== undefined) {
      if (typeof body.content !== "string" || !body.content.trim()) {
        return NextResponse.json({ error: "Isi materi tidak boleh kosong." }, { status: 400 });
      }
      const cleanContent = body.content.trim();
      if (cleanContent.length > MAX_CONTENT_CHARS) {
        return NextResponse.json(
          { error: `Isi materi melebihi batas maksimum ${MAX_CONTENT_CHARS.toLocaleString("id-ID")} karakter.` },
          { status: 413 }
        );
      }

      const chunks = splitIntoStudyChunks(cleanContent, 3000, 3500);
      if (chunks.length === 0) {
        return NextResponse.json({ error: "Teks materi kosong setelah diproses." }, { status: 400 });
      }
      if (chunks.length > MAX_CHUNKS) {
        return NextResponse.json(
          { error: `Jumlah chunk (${chunks.length}) melebihi batas maksimum ${MAX_CHUNKS} chunk.` },
          { status: 413 }
        );
      }

      data.chunksJson = JSON.stringify(chunks);
      data.totalChunks = chunks.length;
      data.charCount = cleanContent.length;
      nextTotalChunks = chunks.length;
    }

    const maxValidIndex = Math.max(0, nextTotalChunks - 1);
    const requestedChunk =
      typeof body.currentChunkIndex === "number"
        ? body.currentChunkIndex
        : typeof body.currentChunk === "number"
          ? body.currentChunk
          : undefined;

    if (body.resetProgress) {
      data.currentChunkIndex = 0;
    } else if (requestedChunk !== undefined && Number.isFinite(requestedChunk)) {
      data.currentChunkIndex = Math.min(maxValidIndex, Math.max(0, Math.floor(requestedChunk)));
    } else if (data.totalChunks !== undefined && existing.currentChunkIndex > maxValidIndex) {
      data.currentChunkIndex = maxValidIndex;
    }

    const updated = await prisma.studyMaterial.update({
      where: { id: materialId },
      data,
      select: MATERIAL_SUMMARY_SELECT,
    });

    return NextResponse.json({ ok: true, material: updated });
  } catch (error) {
    return safeApiError(error, "Gagal memperbarui materi.", 400);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const materialId = Number.parseInt(id, 10);
    if (Number.isNaN(materialId)) {
      return NextResponse.json({ error: "ID materi tidak valid." }, { status: 400 });
    }

    await prisma.studyMaterial.delete({ where: { id: materialId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeApiError(error, "Gagal menghapus materi.", 400);
  }
}
