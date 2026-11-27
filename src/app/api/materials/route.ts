import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitIntoStudyChunks } from "@/lib/chunkText";
import { safeApiError } from "@/lib/apiError";

const MAX_TITLE_CHARS = 160;
const MAX_CONTENT_CHARS = 400_000;
const MAX_CHUNKS = 150;

export async function GET() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        sourceType: true,
        totalChunks: true,
        currentChunkIndex: true,
        charCount: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ materials });
  } catch (error) {
    return safeApiError(error, "Gagal memuat materi belajar.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      sourceType?: string;
      content?: string;
    };

    const title = body.title?.trim();
    const content = body.content?.trim();
    if (!title || !content) {
      return NextResponse.json({ error: "Judul dan isi materi tidak boleh kosong." }, { status: 400 });
    }
    if (title.length > MAX_TITLE_CHARS) {
      return NextResponse.json({ error: `Judul materi maksimal ${MAX_TITLE_CHARS} karakter.` }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return NextResponse.json(
        { error: `Isi materi melebihi batas maksimum ${MAX_CONTENT_CHARS.toLocaleString("id-ID")} karakter.` },
        { status: 413 }
      );
    }

    const chunks = splitIntoStudyChunks(content, 3000, 3500);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Teks materi kosong setelah diproses." }, { status: 400 });
    }
    if (chunks.length > MAX_CHUNKS) {
      return NextResponse.json(
        { error: `Jumlah chunk (${chunks.length}) melebihi batas maksimum ${MAX_CHUNKS} chunk.` },
        { status: 413 }
      );
    }

    const allowedTypes = new Set(["PDF", "MARKDOWN", "CODE", "TEXT"]);
    const sourceType = body.sourceType && allowedTypes.has(body.sourceType) ? body.sourceType : "TEXT";

    const created = await prisma.studyMaterial.create({
      data: {
        title,
        sourceType,
        chunksJson: JSON.stringify(chunks),
        totalChunks: chunks.length,
        currentChunkIndex: 0,
        charCount: content.length,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        sourceType: true,
        totalChunks: true,
        currentChunkIndex: true,
        charCount: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, material: created });
  } catch (error) {
    return safeApiError(error, "Gagal menyimpan materi belajar.", 500);
  }
}
