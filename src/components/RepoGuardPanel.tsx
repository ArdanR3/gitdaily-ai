"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck, Search, Lock, Loader2 } from "lucide-react";

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

export function RepoGuardPanel({ repos, onToggleGuard }: RepoGuardPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ALLOWED" | "PROTECTED">("ALL");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repos.filter((r) => {
      if (filter === "ALLOWED" && r.isProtected) return false;
      if (filter === "PROTECTED" && !r.isProtected) return false;
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
    <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#f0f6fc]">Repository Guard Panel</h2>
          <p className="text-xs text-[#8b949e]">
            Tandai repo yang tidak boleh disentuh AI (misal Unity, Blender, atau proyek tim).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-48 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b949e]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari repo..."
              className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] py-1.5 pl-8 pr-2.5 text-xs text-[#f0f6fc] placeholder-[#6e7681] outline-none focus:border-[#58a6ff]"
            />
          </div>

          <div className="inline-flex rounded-lg border border-[#30363d] bg-[#0d1117] p-0.5 text-[11px]">
            {(["ALL", "ALLOWED", "PROTECTED"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-2 py-1 transition ${
                  filter === f ? "bg-[#21262d] font-medium text-[#f0f6fc]" : "text-[#8b949e] hover:text-[#c9d1d9]"
                }`}
              >
                {f === "ALL" ? "Semua" : f === "ALLOWED" ? "Allowed" : "Protected"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#30363d] py-8 text-center text-xs text-[#8b949e]">
          {repos.length === 0
            ? 'Belum ada repository tersinkronisasi. Klik "Sync Repos" di atas.'
            : "Tidak ada repository yang cocok dengan filter."}
        </div>
      ) : (
        <div className="max-h-96 divide-y divide-[#21262d] overflow-y-auto rounded-lg border border-[#30363d] bg-[#0d1117]">
          {filtered.map((repo) => {
            const busy = togglingId === repo.id;
            return (
              <div key={repo.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-mono text-xs font-medium text-[#f0f6fc]">{repo.name}</span>
                    {repo.language && (
                      <span className="rounded bg-[#21262d] px-1.5 py-0.5 text-[10px] text-[#8b949e]">
                        {repo.language}
                      </span>
                    )}
                    {repo.isPrivate && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8b949e]">
                        <Lock className="h-2.5 w-2.5" />
                        Private
                      </span>
                    )}
                  </div>
                  {repo.isProtected && repo.protectionReason && (
                    <p className="mt-0.5 truncate text-[11px] text-[#f0883e]">{repo.protectionReason}</p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggle(repo)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition disabled:opacity-50 ${
                    repo.isProtected
                      ? "border-[#f85149]/40 bg-[#f85149]/15 text-[#ff7b72] hover:bg-[#f85149]/25"
                      : "border-[#238636]/40 bg-[#238636]/15 text-[#3fb950] hover:bg-[#238636]/25"
                  }`}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : repo.isProtected ? (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  {repo.isProtected ? "Protected" : "Allowed"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
