import { NextResponse } from "next/server";
import { executeSuggestionById } from "@/lib/services/executionService";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const suggestionId = Number.parseInt(id, 10);
    if (Number.isNaN(suggestionId)) {
      return NextResponse.json({ error: "ID saran tidak valid." }, { status: 400 });
    }

    const result = await executeSuggestionById(suggestionId, "MANUAL_APPROVAL");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengeksekusi push ke GitHub.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
