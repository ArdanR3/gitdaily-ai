"use client";

import Link from "next/link";
import {
  RefreshCw,
  Sparkles,
  Settings,
  LogOut,
  ExternalLink,
  Loader2,
  BookOpen,
  Terminal,
} from "lucide-react";

export interface ProfileData {
  profile: {
    username: string;
    name: string;
    avatarUrl: string;
    profileUrl: string;
    bio: string | null;
    publicRepos: number;
    totalPrivateRepos: number;
  };
  todayKey: string;
  statusToday: "DONE" | "PENDING";
  streak: number;
  mode: "APPROVAL" | "AUTOPILOT";
  nextSchedule: {
    targetTimeWib: string;
    remainingMinutes: number;
    label: string;
  };
}

interface HeaderProfileProps {
  data: ProfileData | null;
  syncing: boolean;
  generating: boolean;
  onSync: () => void;
  onGenerate: () => void;
  onLogout: () => void;
}

export function HeaderProfile({
  data,
  syncing,
  generating,
  onSync,
  onGenerate,
  onLogout,
}: HeaderProfileProps) {
  const isDone = data?.statusToday === "DONE";
  const username = data?.profile.username || "ArdanR3";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border-subtle)] bg-[#020617]/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand + Operator Identity */}
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="relative shrink-0">
              {data?.profile.avatarUrl ? (
                <img
                  src={data.profile.avatarUrl}
                  alt={`Avatar ${username}`}
                  className="h-11 w-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] font-mono text-sm font-bold text-emerald-400"
                >
                  AR
                </div>
              )}
              <span
                title={data ? (isDone ? "Target harian selesai" : "Menunggu eksekusi hari ini") : "Memuat status"}
                className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#020617] ${
                  !data ? "bg-slate-500" : isDone ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <h1 className="font-mono text-base font-bold tracking-tight text-[var(--color-foreground)] sm:text-lg">
                    GitDaily AI
                  </h1>
                </div>

                <a
                  href={data?.profile.profileUrl || `https://github.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-card)] px-2 py-0.5 font-mono text-xs font-medium text-sky-400 transition-colors duration-200 hover:border-sky-500/60 hover:text-sky-300"
                >
                  @{username}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>

                {data && (
                  <span className="hidden rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-muted)] px-2 py-0.5 font-mono text-[11px] font-medium text-slate-300 sm:inline-flex">
                    {data.todayKey} · WIB
                  </span>
                )}
              </div>

              <p className="mt-0.5 truncate text-xs text-[var(--color-muted-foreground)]">
                {data?.profile.bio
                  ? data.profile.bio
                  : "Automation console untuk commit harian, guard repository, dan review kode AI."}
              </p>
            </div>
          </div>

          {/* Command Actions & Navigation */}
          <nav aria-label="Navigasi utama dashboard" className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium text-slate-200 transition-colors duration-200 hover:border-slate-500 hover:bg-[var(--color-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              )}
              <span>{syncing ? "Syncing..." : "Sync Repos"}</span>
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-sm shadow-emerald-950/50 transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{generating ? "Generating..." : "Generate Suggestions"}</span>
            </button>

            <div className="hidden h-5 w-px bg-[var(--color-border-subtle)] sm:block" aria-hidden="true" />

            <Link
              href="/materials"
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:text-white"
            >
              <BookOpen className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
              <span>Materials</span>
            </Link>

            <Link
              href="/settings"
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-[var(--color-border)] hover:bg-[var(--color-muted)] hover:text-white"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>Settings</span>
            </Link>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Logout dari dashboard"
              title="Logout"
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-transparent px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors duration-200 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
