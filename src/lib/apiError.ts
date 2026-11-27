import { NextResponse } from "next/server";

export class SafeHttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SafeHttpError";
    this.status = status;
  }
}

const INTERNAL_ERROR_PATTERN =
  /prisma|postgres|neon|sql|select\s+|insert\s+|update\s+|delete\s+|database_url|econnrefused|enotfound|etimedout|stack|node_modules/i;

function isPrismaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error && typeof error.name === "string" ? error.name : "";
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  return name.startsWith("Prisma") || /^P\d{4}$/.test(code);
}

export function safeApiError(
  error: unknown,
  fallbackMessage: string,
  status = 500,
  options: { exposeDomainMessage?: boolean } = {}
) {
  console.error("[API Error]", error);

  if (error instanceof SafeHttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (options.exposeDomainMessage && error instanceof Error && !isPrismaError(error)) {
    const clean = error.message.replace(/\s+/g, " ").trim();
    if (clean && clean.length <= 260 && !INTERNAL_ERROR_PATTERN.test(clean)) {
      return NextResponse.json({ error: clean }, { status });
    }
  }

  return NextResponse.json({ error: fallbackMessage }, { status });
}
