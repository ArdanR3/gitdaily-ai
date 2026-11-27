import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeApiError } from "@/lib/apiError";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const materialId = Number.parseInt(id, 10);
    if (Number.isNaN(materialId)) {
      return NextResponse.json({ error: "ID materi tidak valid." }, { status: 400 });
    }

    const body = (await request.json()) as { isActive?: boolean; resetProgress?: boolean };
    const data: { isActive?: boolean; currentChunkIndex?: number } = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (body.resetProgress) data.currentChunkIndex = 0;

    const updated = await prisma.studyMaterial.update({
      where: { id: materialId },
      data,
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
