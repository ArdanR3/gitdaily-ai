import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: number;
      isProtected?: boolean;
      protectionReason?: string | null;
    };

    if (typeof body.id !== "number" || typeof body.isProtected !== "boolean") {
      return NextResponse.json({ error: "Field id dan isProtected wajib diisi." }, { status: 400 });
    }

    const existing = await prisma.repository.findUnique({
      where: { id: body.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Repository tidak ditemukan." }, { status: 404 });
    }

    if (existing.isPrivate && body.isProtected === false) {
      return NextResponse.json(
        { error: "Repository berstatus Private dikunci permanen dan tidak bisa diubah menjadi Allowed." },
        { status: 403 }
      );
    }

    const updated = await prisma.repository.update({
      where: { id: body.id },
      data: {
        isProtected: existing.isPrivate ? true : body.isProtected,
        protectionReason: existing.isPrivate
          ? "Private repository (dilindungi otomatis)"
          : body.isProtected
          ? body.protectionReason || "Dilindungi manual oleh user"
          : null,
      },
    });

    return NextResponse.json({ ok: true, repository: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui status proteksi repo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
