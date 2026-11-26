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

    const updated = await prisma.repository.update({
      where: { id: body.id },
      data: {
        isProtected: body.isProtected,
        protectionReason: body.isProtected ? body.protectionReason || "Dilindungi manual oleh user" : null,
      },
    });

    return NextResponse.json({ ok: true, repository: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui status proteksi repo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
