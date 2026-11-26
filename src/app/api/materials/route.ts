import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { splitIntoStudyChunks } from "@/lib/chunkText";

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
    const message = error instanceof Error ? error.message : "Gagal memuat materi belajar.";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const chunks = splitIntoStudyChunks(content, 3000, 3500);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Teks materi kosong setelah diproses." }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "Gagal menyimpan materi belajar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
