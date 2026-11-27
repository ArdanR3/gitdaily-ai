import { NextResponse } from "next/server";
import { executeSuggestionById } from "@/lib/services/executionService";
import { safeApiError } from "@/lib/apiError";
import type { PushMode } from "@/types";

const ALLOWED_PUSH_MODES = new Set<PushMode>(["DIRECT_MAIN", "BRANCH_PR"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const suggestionId = Number.parseInt(id, 10);
    if (Number.isNaN(suggestionId)) {
      return NextResponse.json({ error: "ID saran tidak valid." }, { status: 400 });
    }

    let pushMode: PushMode | undefined;
    try {
      const body = (await request.json()) as { pushMode?: unknown };
      if (body.pushMode !== undefined) {
        if (typeof body.pushMode !== "string" || !ALLOWED_PUSH_MODES.has(body.pushMode as PushMode)) {
          return NextResponse.json({ error: "Mode push tidak valid." }, { status: 400 });
        }
        pushMode = body.pushMode as PushMode;
      }
    } catch {
      // Allow empty body to fall back to AppSettings.pushMode.
    }

    const result = await executeSuggestionById(suggestionId, "MANUAL_APPROVAL", pushMode);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return safeApiError(error, "Gagal mengeksekusi push ke GitHub.", 400, { exposeDomainMessage: true });
  }
}
