import { NextResponse } from "next/server";
import { syncRepositoriesFromGitHub } from "@/lib/services/githubService";

export async function POST() {
  try {
    const repos = await syncRepositoriesFromGitHub();
    return NextResponse.json({
      ok: true,
      syncedCount: repos.length,
      repositories: repos,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal sinkronisasi repository.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
