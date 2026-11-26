"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Flame,
  Clock,
  ShieldCheck,
  Hourglass,
  X,
} from "lucide-react";
import { HeaderProfile, type ProfileData } from "@/components/HeaderProfile";
import { SuggestionCard } from "@/components/SuggestionCard";
import { CodePreviewModal, type SuggestionItem } from "@/components/CodePreviewModal";
import { RepoGuardPanel, type RepoItem } from "@/components/RepoGuardPanel";
import { ActivityTimeline, type ActivityLogItem } from "@/components/ActivityTimeline";

interface ToastMessage {
  type: "success" | "error";
  text: string;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Memuat data dashboard" role="status">
      {/* KPI Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4"
          >
            <div className="h-3 w-20 rounded bg-[var(--color-muted)]" />
            <div className="mt-3 h-6 w-28 rounded bg-[var(--color-muted)]" />
            <div className="mt-2 h-2.5 w-24 rounded bg-[var(--color-muted)]/70" />
          </div>
        ))}
      </div>

      {/* Suggestions Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5"
          >
            <div className="h-5 w-28 rounded bg-[var(--color-muted)]" />
            <div className="mt-4 h-5 w-48 rounded bg-[var(--color-muted)]" />
            <div className="mt-3 h-10 w-full rounded-lg bg-[var(--color-background)]" />
            <div className="mt-4 h-12 w-full rounded bg-[var(--color-muted)]/60" />
          </div>
        ))}
      </div>

      {/* Lower Panels Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5"
          >
            <div className="h-4 w-36 rounded bg-[var(--color-muted)]" />
            <div className="mt-4 space-y-2.5">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="h-11 rounded-lg bg-[var(--color-background)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
      showToast("error", "Gagal memuat data dashboard. Pastikan konfigurasi & database aktif.");
    } finally {
      setInitialLoading(false);
    }
  }, [router, showToast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const repoStats = useMemo(() => {
    let protectedCount = 0;
    for (const r of repos) {
      if (r.isProtected || r.isPrivate) protectedCount += 1;
    }
    return {
      total: repos.length,
      protectedCount,
      allowedCount: repos.length - protectedCount,
    };
  }, [repos]);

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
      showToast("success", "Saran harian baru dari AI siap ditinjau!");
    } catch {
      showToast("error", "Kesalahan jaringan saat memanggil AI.");
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

  const isDone = profileData?.statusToday === "DONE" || executedToday;

  return (
    <div className="dev-grid-bg min-h-screen bg-[var(--color-background)]">
      <HeaderProfile
        data={profileData}
        syncing={syncing}
        generating={generating}
        onSync={handleSync}
        onGenerate={handleGenerate}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium ${
              toast.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{toast.text}</span>
            </div>
            <button
              type="button"
              aria-label="Tutup notifikasi"
              onClick={() => setToast(null)}
              className="cursor-pointer rounded p-1 opacity-75 transition-opacity hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {initialLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Operations Telemetry Strip */}
            <section aria-label="Ringkasan status harian" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {/* Daily Target Status */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <span>Daily Status</span>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Hourglass className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`font-mono text-xl font-bold ${isDone ? "text-emerald-400" : "text-amber-300"}`}
                  >
                    {isDone ? "DONE" : "PENDING"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  {profileData ? `${profileData.todayKey} · ${isDone ? "1/1 push" : "0/1 push"}` : "Menunggu status"}
                </p>
              </div>

              {/* Active Streak */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <span>Commit Streak</span>
                  <Flame className="h-4 w-4 text-amber-400" aria-hidden="true" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-mono text-xl font-bold text-[var(--color-foreground)]">
                    {profileData?.streak ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-400">hari berturut</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {logs.length} total eksekusi tercatat
                </p>
              </div>

              {/* Next Schedule */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <span>Next Schedule</span>
                  <Clock className="h-4 w-4 text-sky-400" aria-hidden="true" />
                </div>
                <div className="mt-2 truncate font-mono text-xl font-bold text-[var(--color-foreground)]">
                  {profileData ? profileData.nextSchedule.targetTimeWib : "—"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-400">
                  <span>{profileData ? `dalam ${profileData.nextSchedule.label}` : "Jadwal belum dimuat"}</span>
                  {profileData && (
                    <span className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] text-slate-300">
                      {profileData.mode}
                    </span>
                  )}
                </div>
              </div>

              {/* Repository Guard Coverage */}
              <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <span>Repo Guard</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-mono text-xl font-bold text-[var(--color-foreground)]">
                    {repoStats.allowedCount}
                  </span>
                  <span className="text-xs font-medium text-slate-400">allowed</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  {repoStats.protectedCount} protected · {repoStats.total} total
                </p>
              </div>
            </section>

            {/* Today's AI Suggestions */}
            <section aria-labelledby="suggestions-heading">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="suggestions-heading" className="font-mono text-base font-semibold text-[var(--color-foreground)]">
                      Today&apos;s AI Suggestions
                    </h2>
                    <span className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-card)] px-2 py-0.5 font-mono text-[11px] text-slate-300">
                      {suggestions.length} opsi
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                    {isDone
                      ? "Target hari ini (1x push) sudah tercapai. Kembali lagi besok untuk menjaga streak!"
                      : "Tinjau kode, sesuaikan bila perlu, lalu approve maksimal 1 saran ke @ArdanR3 hari ini."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={generating || isDone}
                  onClick={handleGenerate}
                  className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors duration-200 hover:border-slate-500 hover:bg-[var(--color-secondary)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  )}
                  <span>Regenerate</span>
                </button>
              </div>

              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/70 px-6 py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
                    Belum ada saran AI untuk hari ini
                  </p>
                  <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                    Sinkronisasi repository terlebih dahulu agar AI mengenal codebase kamu, lalu buat saran commit
                    harian siap review.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={syncing}
                      className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors duration-200 hover:bg-[var(--color-secondary)] disabled:opacity-50"
                    >
                      {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Sync Repos
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || isDone}
                      className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Generate Suggestions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestions.map((item) => (
                    <SuggestionCard
                      key={item.id}
                      suggestion={item}
                      executedToday={isDone}
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
            showToast("success", "Perubahan kode & commit message berhasil disimpan.");
          }}
        />
      )}
    </div>
  );
}
