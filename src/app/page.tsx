"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  RefreshCw,
  Sparkles,
  Loader2,
  Swords,
} from "lucide-react";
import { HeaderProfile, type ProfileData } from "@/components/HeaderProfile";
import { QuestRoadmapTrack, type StudyMaterialSummary } from "@/components/QuestRoadmapTrack";
import { GitBoyDeckFigure, type QuestStageId } from "@/components/figures/gitboy-deck/GitBoyDeckFigure";
import { SuggestionCard } from "@/components/SuggestionCard";
import { CodePreviewModal, type SuggestionItem } from "@/components/CodePreviewModal";
import { RepoGuardPanel, type RepoItem } from "@/components/RepoGuardPanel";
import { ActivityTimeline, type ActivityLogItem } from "@/components/ActivityTimeline";
import type { PushMode } from "@/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Memuat Dashboard GitDaily AI" role="status">
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="nb-card h-72 animate-pulse p-6 xl:col-span-7">
          <div className="h-5 w-40 border-2 border-black bg-[#FFD23F]" />
          <div className="mt-6 h-40 w-full border-2 border-black bg-[#F5F0E8]" />
        </div>
        <div className="nb-card h-72 animate-pulse p-6 xl:col-span-5">
          <div className="h-5 w-32 border-2 border-black bg-[#B8A9FA]" />
          <div className="mt-6 h-40 w-full border-2 border-black bg-[#F5F0E8]" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="nb-card h-72 animate-pulse">
            <div className="h-20 border-b-3 border-black bg-[#74B9FF]" />
            <div className="space-y-3 p-5">
              <div className="h-10 border-2 border-black bg-[#F5F0E8]" />
              <div className="h-14 border-2 border-black bg-[#F5F0E8]" />
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
  const [materials, setMaterials] = useState<StudyMaterialSummary[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewItem, setPreviewItem] = useState<SuggestionItem | null>(null);
  const [selectedStage, setSelectedStage] = useState<QuestStageId>("03");

  const showToast = useCallback((type: "success" | "error", text: string) => {
    if (type === "success") {
      toast.success(text, { duration: 5500 });
    } else {
      // WCAG 2.2.2: Error toasts stay visible until manually dismissed
      toast.error(text, { duration: Infinity });
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [profRes, suggRes, repoRes, logRes, matRes] = await Promise.all([
        fetch("/api/github/profile"),
        fetch("/api/suggestions"),
        fetch("/api/repos"),
        fetch("/api/logs"),
        fetch("/api/materials"),
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

      if (matRes.ok) {
        const mData = (await matRes.json()) as { materials: StudyMaterialSummary[] };
        setMaterials(mData.materials || []);
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

  const activeMaterials = useMemo(() => materials.filter((m) => m.isActive), [materials]);
  const primaryActiveMaterial = activeMaterials[0] ?? null;

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
      showToast("success", "Saran quest harian baru dari AI siap dipilih!");
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

  async function handleExecute(id: number, pushMode?: PushMode) {
    try {
      const res = await fetch(`/api/suggestions/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pushMode ? { pushMode } : {}),
      });
      const data = (await res.json()) as {
        pushResult?: { repo: string; commitUrl: string; prUrl?: string; prNumber?: number };
        error?: string;
      };
      if (!res.ok) {
        showToast("error", data.error || "Gagal push ke GitHub.");
        await loadAll();
        return;
      }
      if (typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        void confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#FFD23F", "#88D498", "#FF6B6B", "#74B9FF", "#B8A9FA", "#000000"],
        });
      }
      const successMsg = data.pushResult?.prUrl
        ? `Quest Cleared! Pull Request #${data.pushResult.prNumber ?? ""} dibuka di github.com/ArdanR3/${data.pushResult.repo}!`
        : `Quest Cleared! Berhasil push ke github.com/ArdanR3/${data.pushResult?.repo}!`;
      showToast("success", successMsg);
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
    <div className="nb-grid-bg min-h-screen">
      <HeaderProfile
        data={profileData}
        syncing={syncing}
        generating={generating}
        onSync={handleSync}
        onGenerate={handleGenerate}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {initialLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Quest Roadmap Track + GITBOY-01 Neo-Brutalist Isometric Cartridge Deck */}
            <div className="grid items-start gap-6 xl:grid-cols-12">
              <div className="min-w-0 xl:col-span-7">
                <QuestRoadmapTrack
                  repoCount={repoStats.total}
                  allowedCount={repoStats.allowedCount}
                  protectedCount={repoStats.protectedCount}
                  activeMaterial={primaryActiveMaterial}
                  activeMaterialsCount={activeMaterials.length}
                  suggestionCount={suggestions.length}
                  executedToday={isDone}
                  todayKey={profileData?.todayKey || "Hari Ini"}
                  streak={profileData?.streak ?? 0}
                  selectedStage={selectedStage}
                  onSelectStage={setSelectedStage}
                  onQuickSync={handleSync}
                  onQuickGenerate={handleGenerate}
                />
              </div>

              <div className="min-w-0 xl:col-span-5">
                <GitBoyDeckFigure
                  selectedStage={selectedStage}
                  onSelectStage={setSelectedStage}
                  telemetry={{
                    streak: profileData?.streak ?? 0,
                    executedToday: isDone,
                    repoCount: repoStats.total,
                    allowedCount: repoStats.allowedCount,
                    protectedCount: repoStats.protectedCount,
                    activeMaterial: primaryActiveMaterial,
                    suggestionCount: suggestions.length,
                  }}
                />
              </div>
            </div>

            {/* Featured Daily Quests (Today's AI Suggestions) */}
            <section aria-labelledby="suggestions-heading">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center border-3 border-black bg-[#FFD23F] text-black shadow-[4px_4px_0_0_#000]">
                    <Swords className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        id="suggestions-heading"
                        className="font-display text-xl font-extrabold uppercase tracking-tight text-black"
                      >
                        Today&apos;s Daily Quests
                      </h2>
                      <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[11px] font-bold text-[#FFD23F]">
                        {suggestions.length} DROPS
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-black/75">
                      {isDone
                        ? "Target 1x commit hari ini sudah tercapai. Streak aman, kembali lagi besok!"
                        : "Pilih 1 misi terbaik, review di Code Forge, lalu klik Approve & Push."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={generating || isDone}
                  onClick={handleGenerate}
                  className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-2 bg-white px-4 py-2 text-xs font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[40px]"
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>Regenerate</span>
                </button>
              </div>

              {suggestions.length === 0 ? (
                <div className="nb-card flex flex-col items-center justify-center bg-[#FFF3C4] px-6 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center border-3 border-black bg-[#FFD23F] text-black shadow-[4px_4px_0_0_#000]">
                    <Sparkles className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="font-display text-lg font-extrabold uppercase text-black">
                    Belum ada saran AI untuk hari ini
                  </p>
                  <p className="mt-1.5 max-w-md text-xs font-semibold leading-relaxed text-black/80">
                    Tekan Sync Repos agar AI mengenali repository aktifmu, lalu Generate Suggestions untuk
                    memunculkan kartu misi harian.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={syncing}
                      className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-2 bg-white px-5 py-2 text-xs font-extrabold uppercase text-black disabled:opacity-50 sm:min-h-[42px]"
                    >
                      {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Sync Repos
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || isDone}
                      className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-2 bg-[#88D498] px-5 py-2 text-xs font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[42px]"
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate Suggestions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {suggestions.map((item) => (
                    <SuggestionCard
                      key={item.id}
                      suggestion={item}
                      executedToday={isDone}
                      defaultPushMode={profileData?.pushMode === "BRANCH_PR" ? "BRANCH_PR" : "DIRECT_MAIN"}
                      onPreview={setPreviewItem}
                      onVisibilityChange={handleVisibilityChange}
                      onExecute={handleExecute}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Repository Guard & Quest Activity Log */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RepoGuardPanel repos={repos} onToggleGuard={handleToggleGuard} />
              <ActivityTimeline logs={logs} />
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {previewItem && (
          <CodePreviewModal
            key={previewItem.id}
            suggestion={previewItem}
            onClose={() => setPreviewItem(null)}
            onSaved={(updated) => {
              setSuggestions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
              showToast("success", "Perubahan kode & commit message berhasil disimpan.");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
