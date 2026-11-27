import { NextResponse } from "next/server";
import { generateDailySuggestions } from "@/lib/services/aiSuggestionService";
import { getTodayWibKey } from "@/lib/time";
import { safeApiError } from "@/lib/apiError";

export async function POST() {
  try {
    const dateKey = getTodayWibKey();
    const suggestions = await generateDailySuggestions(dateKey);
    return NextResponse.json({
      ok: true,
      dateKey,
      suggestions,
    });
  } catch (error) {
    return safeApiError(error, "Gagal menghasilkan saran AI.", 500, { exposeDomainMessage: true });
  }
}
