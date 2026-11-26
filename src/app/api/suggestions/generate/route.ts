import { NextResponse } from "next/server";
import { generateDailySuggestions } from "@/lib/services/aiSuggestionService";
import { getTodayWibKey } from "@/lib/time";

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
    const message = error instanceof Error ? error.message : "Gagal menghasilkan saran AI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
