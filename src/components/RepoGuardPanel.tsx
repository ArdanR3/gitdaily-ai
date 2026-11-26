"use client";

import { useMemo, useState } from "react";
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

const LANGUAGE_DOT: Record<string, string> = {
  TypeScript: "bg-sky-400",
  JavaScript: "bg-amber-300",
  Python: "bg-blue-400",
  PHP: "bg-indigo-400",
  Java: "bg-orange-400",
  "C#": "bg-emerald-400",
  HTML: "bg-rose-400",
  CSS: "bg-violet-400",
  Go: "bg-cyan-400",
  Rust: "bg-orange-500",
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
    setTogglingId(repo.id);
    try {
      await onToggleGuard(repo.id, !repo.isProtected);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section
      aria-labelledby="repo-guard-heading"
      className="flex flex-col rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5"
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <h2 id="repo-guard-heading" className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
                Repository Guard Panel
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Tandai repo yang tidak boleh disentuh AI (misal Unity, Blender, atau proyek sensitif).
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-2 py-0.5 font-mono text-[11px] text-slate-300">
            {repos.length} repo
          </span>
        </div>

        {/* Search + Filter Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              aria-label="Cari repository berdasarkan nama atau bahasa"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama repo atau bahasa..."
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] py-2 pl-9 pr-8 text-xs text-[var(--color-foreground)] placeholder-slate-500 transition-colors duration-200 focus:border-emerald-500"
            />
            {query && (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-slate-400 transition-colors hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Filter status repository"
            className="inline-flex shrink-0 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-0.5 text-[11px]"
          >
            {(
              [
                { key: "ALL", label: "Semua", count: counts.all },
                { key: "ALLOWED", label: "Allowed", count: counts.allowed },
                { key: "PROTECTED", label: "Protected", count: counts.protected },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={filter === tab.key}
                onClick={() => setFilter(tab.key)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors duration-150 ${
                  filter === tab.key
                    ? "bg-[var(--color-secondary)] font-medium text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] text-slate-400">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-10 text-center text-xs text-[var(--color-muted-foreground)]">
          {repos.length === 0
            ? 'Belum ada repository tersinkronisasi. Klik "Sync Repos" di atas.'
            : "Tidak ada repository yang cocok dengan filter atau kata kunci."}
        </div>
      ) : (
        <div className="max-h-[420px] divide-y divide-[var(--color-border-subtle)] overflow-y-auto rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)]">
          {filtered.map((repo) => {
            const busy = togglingId === repo.id;
            const locked = repo.isProtected || repo.isPrivate;
            const dotClass = repo.language ? LANGUAGE_DOT[repo.language] || "bg-slate-400" : null;

            return (
              <div
                key={repo.id}
                className="flex items-center justify-between gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-[var(--color-card)]/70"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-mono text-xs font-semibold text-slate-100">{repo.name}</span>
                    {repo.language && (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                        {dotClass && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />}
                        {repo.language}
                      </span>
                    )}
                    {repo.isPrivate && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                        <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                        Private
                      </span>
                    )}
                  </div>

                  {locked && (
                    <p className="mt-1 truncate text-[11px] text-amber-300/90">
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
                  title={repo.isPrivate ? "Repository Private dikunci permanen" : `Ubah guard untuk ${repo.name}`}
                  onClick={() => handleToggle(repo)}
                  className={`inline-flex min-h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    locked
                      ? "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
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
                  <span>{repo.isPrivate ? "Locked" : repo.isProtected ? "Protected" : "Allowed"}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
