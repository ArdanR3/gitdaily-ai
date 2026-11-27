import { NextResponse } from "next/server";
import { syncRepositoriesFromGitHub } from "@/lib/services/githubService";
import { safeApiError } from "@/lib/apiError";

export async function POST() {
  try {
    const repos = await syncRepositoriesFromGitHub();
    return NextResponse.json({
      ok: true,
      syncedCount: repos.length,
      repositories: repos,
    });
  } catch (error) {
    return safeApiError(error, "Gagal sinkronisasi repository.", 500, { exposeDomainMessage: true });
  }
}
