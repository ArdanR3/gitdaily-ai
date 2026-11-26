"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { HeaderProfile, type ProfileData } from "@/components/HeaderProfile";
import { SuggestionCard } from "@/components/SuggestionCard";
import { CodePreviewModal, type SuggestionItem } from "@/components/CodePreviewModal";
import { RepoGuardPanel, type RepoItem } from "@/components/RepoGuardPanel";
import { ActivityTimeline, type ActivityLogItem } from "@/components/ActivityTimeline";

interface ToastMessage {
  type: "success" | "error";
  text: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [executedToday, setExecutedToday] = useState(false);
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewItem, setPreviewItem] = useState<SuggestionItem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((curr) => (curr?.text === text ? null : curr));
    }, 5500);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [profRes, suggRes, repoRes, logRes] = await Promise.all([
        fetch("/api/github/profile"),
        fetch("/api/suggestions"),
        fetch("/api/repos"),
        fetch("/api/logs"),
      ]);

      if (profRes.status === 401) {
        router.push("/login");
        return;
      }

      if (profRes.ok) {
        const pData = (await profRes.json()) as ProfileData & { profileError?: string | null };
        setProfileData(pData);
        if (pData.profileError) {
          showToast("error", `GitHub API warning: ${pData.profileError}`);
        }
      } else {
        const errData = (await profRes.json().catch(() => ({}))) as { error?: string };
        showToast("error", errData.error || `Gagal memuat profil (HTTP ${profRes.status}).`);
      }
      if (suggRes.ok) {
        const sData = (await suggRes.json()) as { suggestions: SuggestionItem[]; executedToday: boolean };
        setSuggestions(sData.suggestions || []);
        setExecutedToday(Boolean(sData.executedToday));
      } else if (suggRes.status !== 401) {
        const errData = (await suggRes.json().catch(() => ({}))) as { error?: string };
        showToast("error", errData.error || `Gagal memuat saran harian (HTTP ${suggRes.status}).`);
      }
      if (repoRes.ok) {
        const rData = (await repoRes.json()) as { repositories: RepoItem[] };
        setRepos(rData.repositories || []);
      }
      if (logRes.ok) {
        const lData = (await logRes.json()) as { logs: ActivityLogItem[] };
        setLogs(lData.logs || []);
      }
    } catch {
      showToast("error", "Gagal memuat data dashboard. Pastikan .env.local & database aktif.");
    } finally {
      setInitialLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/github/sync", { method: "POST" });
      const data = (await res.json()) as { syncedCount?: number; repositories?: RepoItem[]; error?: string };
      if (!res.ok) {
        showToast("error", data.error || "Gagal sinkronisasi repository.");
        return;
      }
      if (data.repositories) setRepos(data.repositories);
      showToast("success", `Berhasil sinkronisasi ${data.syncedCount ?? 0} repository milik ArdanR3.`);
      await loadAll();
    } catch {
      showToast("error", "Kesalahan jaringan saat sinkronisasi.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/suggestions/generate", { method: "POST" });
      const data = (await res.json()) as { suggestions?: SuggestionItem[]; error?: string };
      if (!res.ok) {
        showToast("error", data.error || "Gagal menghasilkan saran AI.");
        return;
      }
      setSuggestions(data.suggestions || []);
      showToast("success", "Saran harian baru dari Gemini AI siap ditinjau!");
    } catch {
      showToast("error", "Kesalahan jaringan saat memanggil Gemini AI.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleVisibilityChange(id: number, visibility: "public" | "private") {
    const res = await fetch(`/api/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    const data = (await res.json()) as { suggestion?: SuggestionItem; error?: string };
    if (!res.ok || !data.suggestion) {
      showToast("error", data.error || "Gagal mengubah visibility.");
      return;
    }
    setSuggestions((prev) => prev.map((s) => (s.id === id ? data.suggestion! : s)));
  }

  async function handleExecute(id: number) {
    try {
      const res = await fetch(`/api/suggestions/${id}/execute`, { method: "POST" });
      const data = (await res.json()) as { pushResult?: { repo: string; commitUrl: string }; error?: string };
      if (!res.ok) {
        showToast("error", data.error || "Gagal push ke GitHub.");
        await loadAll();
        return;
      }
      showToast("success", `Berhasil push ke github.com/ArdanR3/${data.pushResult?.repo}!`);
      await loadAll();
    } catch {
      showToast("error", "Kesalahan jaringan saat eksekusi push.");
    }
  }

  async function handleToggleGuard(id: number, isProtected: boolean) {
    const res = await fetch("/api/repos/guard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isProtected }),
    });
    const data = (await res.json()) as { repository?: RepoItem; error?: string };
    if (!res.ok || !data.repository) {
      showToast("error", data.error || "Gagal mengubah status Repository Guard.");
      return;
    }
    setRepos((prev) => prev.map((r) => (r.id === id ? data.repository! : r)));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <HeaderProfile
        data={profileData}
        syncing={syncing}
        generating={generating}
        onSync={handleSync}
        onGenerate={handleGenerate}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {toast && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
              toast.type === "success"
                ? "border-[#238636]/50 bg-[#238636]/15 text-[#3fb950]"
                : "border-[#f85149]/50 bg-[#f85149]/15 text-[#ff7b72]"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {initialLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#8b949e]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#58a6ff]" />
            Memuat dashboard @ArdanR3...
          </div>
        ) : (
          <>
            {/* Today's AI Suggestions */}
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-[#f0f6fc]">Today&apos;s AI Suggestions</h2>
                  <p className="text-xs text-[#8b949e]">
                    {executedToday
                      ? "Target hari ini (1x push) sudah tercapai. Kembali lagi besok!"
                      : "Pilih maksimal 1 saran untuk dieksekusi ke akun @ArdanR3 hari ini."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={generating || executedToday}
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] transition hover:border-[#8b949e] hover:bg-[#30363d] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerate
                </button>
              </div>

              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#30363d] bg-[#161b22]/50 px-6 py-12 text-center">
                  <Sparkles className="mb-3 h-8 w-8 text-[#58a6ff]" />
                  <p className="text-sm font-medium text-[#f0f6fc]">Belum ada saran AI untuk hari ini</p>
                  <p className="mt-1 max-w-md text-xs text-[#8b949e]">
                    Klik &quot;Sync Repos&quot; terlebih dahulu agar AI mengenal repo kamu, lalu klik &quot;Generate Suggestions&quot;.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestions.map((item) => (
                    <SuggestionCard
                      key={item.id}
                      suggestion={item}
                      executedToday={executedToday}
                      onPreview={setPreviewItem}
                      onVisibilityChange={handleVisibilityChange}
                      onExecute={handleExecute}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Guard Panel & Activity Log */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RepoGuardPanel repos={repos} onToggleGuard={handleToggleGuard} />
              <ActivityTimeline logs={logs} />
            </div>
          </>
        )}
      </main>

      {previewItem && (
        <CodePreviewModal
          suggestion={previewItem}
          onClose={() => setPreviewItem(null)}
          onSaved={(updated) => {
            setSuggestions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            showToast("success", "Perubahan draf kode & commit message tersimpan.");
          }}
        />
      )}
    </div>
  );
}
