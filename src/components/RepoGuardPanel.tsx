"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Search, Lock, Loader2, X, Shield } from "lucide-react";

export interface RepoItem {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  isProtected: boolean;
  protectionReason: string | null;
}

interface RepoGuardPanelProps {
  repos: RepoItem[];
  onToggleGuard: (id: number, isProtected: boolean) => Promise<void>;
}

const LANGUAGE_BADGE: Record<string, string> = {
  TypeScript: "bg-[#74B9FF]",
  JavaScript: "bg-[#FFD23F]",
  Python: "bg-[#7FDBDA]",
  PHP: "bg-[#B8A9FA]",
  Java: "bg-[#FFA552]",
  "C#": "bg-[#88D498]",
  HTML: "bg-[#FF6B6B]",
  CSS: "bg-[#B8A9FA]",
};

export function RepoGuardPanel({ repos, onToggleGuard }: RepoGuardPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ALLOWED" | "PROTECTED">("ALL");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const counts = useMemo(() => {
    let protectedCount = 0;
    for (const r of repos) {
      if (r.isProtected || r.isPrivate) protectedCount += 1;
    }
    return {
      all: repos.length,
      allowed: repos.length - protectedCount,
      protected: protectedCount,
    };
  }, [repos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((r) => {
      const locked = r.isProtected || r.isPrivate;
      if (filter === "ALLOWED" && locked) return false;
      if (filter === "PROTECTED" && !locked) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.language || "").toLowerCase().includes(q) ||
        (r.protectionReason || "").toLowerCase().includes(q)
      );
    });
  }, [repos, query, filter]);

  async function handleToggle(repo: RepoItem) {
    if (repo.isPrivate) return;
    setTogglingId(repo.id);
    try {
      await onToggleGuard(repo.id, !repo.isProtected);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section aria-labelledby="repo-guard-heading" className="nb-card flex flex-col p-5">
      <div className="mb-4 flex flex-col gap-3.5 border-b-3 border-black pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#88D498] text-black">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="repo-guard-heading"
                className="font-display text-base font-extrabold uppercase text-black"
              >
                Repository Guard Panel
              </h2>
              <p className="text-xs font-medium text-black/75">
                Kunci repo yang tidak boleh disentuh AI (repo Private dikunci permanen).
              </p>
            </div>
          </div>

          <span className="shrink-0 border-2 border-black bg-[#FFD23F] px-2.5 py-1 font-mono text-xs font-extrabold text-black">
            {repos.length} REPO
          </span>
        </div>

        {/* Search + Animated Brutalist Filter Tabs */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              aria-label="Cari repository"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama repo atau bahasa..."
              className="nb-input w-full py-2 pl-9 pr-8 text-base font-bold placeholder-black/65 sm:text-xs"
            />
            {query && (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex min-h-[32px] min-w-[32px] -translate-y-1/2 cursor-pointer items-center justify-center p-1 text-black hover:bg-[#FFD23F]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Filter status repository"
            className="inline-flex shrink-0 border-2 border-black bg-[#F5F0E8] p-0.5 text-[11px]"
          >
            {(
              [
                { key: "ALL", label: "Semua", count: counts.all },
                { key: "ALLOWED", label: "Allowed", count: counts.allowed },
                { key: "PROTECTED", label: "Protected", count: counts.protected },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.key)}
                  className={`relative inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 px-3 py-1.5 font-extrabold uppercase transition-colors sm:min-h-[32px] ${
                    active ? "text-[#FFD23F]" : "text-black hover:bg-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nbRepoGuardTab"
                      transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                      className="absolute inset-0 bg-black"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 font-mono text-[10px] ${
                      active ? "text-white" : "text-black/70"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-black bg-[#F5F0E8] px-4 py-10 text-center text-xs font-bold text-black/75">
          {repos.length === 0
            ? 'Belum ada repository tersinkronisasi. Klik "Sync Repos" di atas.'
            : "Tidak ada repository yang cocok dengan filter atau pencarian."}
        </div>
      ) : (
        <div className="max-h-[430px] divide-y-2 divide-black overflow-y-auto overscroll-contain border-2 border-black bg-[#FFFDF5]">
          {filtered.map((repo) => {
            const busy = togglingId === repo.id;
            const locked = repo.isProtected || repo.isPrivate;
            const langBg = repo.language ? LANGUAGE_BADGE[repo.language] || "bg-[#F5F0E8]" : null;

            return (
              <div
                key={repo.id}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#FFF3C4]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="break-all font-mono text-xs font-extrabold text-black">
                      {repo.name}
                    </span>
                    {repo.language && (
                      <span
                        className={`border border-black px-1.5 py-0.5 font-mono text-[10px] font-bold text-black ${langBg}`}
                      >
                        {repo.language}
                      </span>
                    )}
                    {repo.isPrivate && (
                      <span className="inline-flex items-center gap-1 border border-black bg-[#FF6B6B] px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-black">
                        <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                        PRIVATE
                      </span>
                    )}
                  </div>

                  {locked && (
                    <p className="mt-1 break-words text-[11px] font-bold leading-snug text-[#B91C1C]">
                      {repo.isPrivate
                        ? "Dikunci permanen: repository Private tidak dapat disentuh AI"
                        : repo.protectionReason || "Dilindungi manual oleh pengguna"}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busy || repo.isPrivate}
                  aria-pressed={locked}
                  title={
                    repo.isPrivate
                      ? "Repository Private dikunci permanen"
                      : `Ubah guard untuk ${repo.name}`
                  }
                  onClick={() => handleToggle(repo)}
                  className={`nb-btn-sm inline-flex min-h-[44px] shrink-0 items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-extrabold uppercase text-black sm:min-h-[34px] ${
                    repo.isPrivate
                      ? "cursor-not-allowed bg-[#FF6B6B] opacity-85 shadow-none"
                      : repo.isProtected
                        ? "cursor-pointer bg-[#FFA552]"
                        : "cursor-pointer bg-[#88D498]"
                  }`}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : repo.isPrivate ? (
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : repo.isProtected ? (
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {repo.isPrivate ? "Locked (Private)" : repo.isProtected ? "Protected" : "Allowed"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
