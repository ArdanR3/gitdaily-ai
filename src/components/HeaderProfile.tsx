"use client";

import Link from "next/link";
import {
  Flame,
  Clock,
  RefreshCw,
  Sparkles,
  Settings,
  LogOut,
  CheckCircle2,
  Hourglass,
  ExternalLink,
  Loader2,
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

  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity & Status */}
          <div className="flex items-center gap-3.5">
            {data?.profile.avatarUrl ? (
              <img
                src={data.profile.avatarUrl}
                alt={data.profile.username}
                className="h-12 w-12 rounded-full border border-[#30363d] object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#30363d] bg-[#0d1117] text-sm font-bold text-[#58a6ff]">
                AR
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-[#f0f6fc]">GitDaily AI</h1>
                <a
                  href={data?.profile.profileUrl || "https://github.com/ArdanR3"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-[#30363d] bg-[#0d1117] px-2.5 py-0.5 text-xs font-medium text-[#58a6ff] transition hover:border-[#58a6ff]"
                >
                  @{data?.profile.username || "ArdanR3"}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {data && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isDone
                        ? "border border-[#238636]/50 bg-[#238636]/15 text-[#3fb950]"
                        : "border border-[#d29922]/50 bg-[#d29922]/15 text-[#e3b341]"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
                    {isDone ? "DONE" : "PENDING"}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8b949e]">
                <span className="inline-flex items-center gap-1 text-[#f0883e]">
                  <Flame className="h-3.5 w-3.5" />
                  <strong className="text-[#f0f6fc]">{data?.streak ?? 0}</strong> hari streak
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#58a6ff]" />
                  Jadwal berikutnya:{" "}
                  <strong className="text-[#c9d1d9]">
                    {data ? `${data.nextSchedule.targetTimeWib} (${data.nextSchedule.label})` : "—"}
                  </strong>
                </span>
                {data && (
                  <span className="rounded bg-[#21262d] px-1.5 py-0.5 font-mono text-[11px] text-[#c9d1d9]">
                    MODE: {data.mode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-xs font-medium text-[#c9d1d9] transition hover:border-[#8b949e] hover:bg-[#30363d] disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sync Repos
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f6feb] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#388bfd] disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? "Generating..." : "Generate Suggestions"}
            </button>

            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-xs font-medium text-[#c9d1d9] transition hover:border-[#8b949e] hover:bg-[#30363d]"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>

            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#0d1117] px-2.5 py-2 text-xs font-medium text-[#8b949e] transition hover:border-[#f85149]/60 hover:text-[#ff7b72]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
