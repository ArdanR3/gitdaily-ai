import { NextResponse } from "next/server";
import { executeSuggestionById } from "@/lib/services/executionService";
import { safeApiError } from "@/lib/apiError";

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
    return safeApiError(error, "Gagal mengeksekusi push ke GitHub.", 400, { exposeDomainMessage: true });
  }
}
