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
  BookOpen,
  Terminal,
  Zap,
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
    <header className="border-b-4 border-black bg-[#FFD23F] pt-[env(safe-area-inset-top)] text-black">
      {/* Top Brutalist Ticker / Nav Strip */}
      <div className="border-b-3 border-black bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#FFD23F]">
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              GITDAILY.AI
            </span>
            {data && (
              <span className="border-2 border-black bg-[#F5F0E8] px-2.5 py-1 font-mono text-[11px] font-bold text-black">
                {data.todayKey} · WIB
              </span>
            )}
          </div>

          <nav aria-label="Navigasi halaman" className="flex flex-wrap items-center gap-2">
            <Link
              href="/materials"
              className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#B8A9FA] px-3 py-1.5 text-xs font-bold uppercase text-black sm:min-h-[36px]"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Materials</span>
            </Link>

            <Link
              href="/settings"
              className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#74B9FF] px-3 py-1.5 text-xs font-bold uppercase text-black sm:min-h-[36px]"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Settings</span>
            </Link>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Logout dari GitDaily AI"
              className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#FF6B6B] px-3 py-1.5 text-xs font-bold uppercase text-black sm:min-h-[36px]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Bold Brutalist Hero Block */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          {/* Operator Profile + Loud Status Stamps */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-fit shrink-0">
              <div className="border-3 border-black bg-white p-1 shadow-[5px_5px_0_0_#000]">
                {data?.profile.avatarUrl ? (
                  <img
                    src={data.profile.avatarUrl}
                    alt={`Avatar ${username}`}
                    className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-16 w-16 items-center justify-center bg-black font-mono text-xl font-bold text-[#FFD23F] sm:h-20 sm:w-20"
                  >
                    AR
                  </div>
                )}
              </div>
              <span
                title={isDone ? "Quest Hari Ini Selesai!" : "Quest Hari Ini Menunggu"}
                className={`absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center border-2 border-black ${
                  !data ? "bg-white text-black" : isDone ? "bg-[#88D498] text-black" : "bg-[#FFA552] text-black"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Zap className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-black sm:text-4xl">
                  GitDaily AI
                </h1>

                <a
                  href={data?.profile.profileUrl || `https://github.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="nb-btn-sm inline-flex cursor-pointer items-center gap-1 bg-white px-3 py-1 font-mono text-xs font-bold text-black"
                >
                  @{username}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>

              {/* High-Contrast Brutalist Telemetry Stamps */}
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 border-2 border-black bg-black px-3 py-1 font-mono text-xs font-bold uppercase text-[#FFD23F] shadow-[3px_3px_0_0_#FFF]">
                  <Flame className="h-4 w-4 fill-[#FFA552] text-[#FFA552]" aria-hidden="true" />
                  <span className="text-sm font-extrabold">{data?.streak ?? 0}</span>
                  <span>HARI STREAK</span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 border-2 border-black px-3 py-1 font-mono text-xs font-extrabold uppercase text-black shadow-[3px_3px_0_0_#000] ${
                    isDone ? "bg-[#88D498]" : "bg-[#FFA552]"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {data ? (isDone ? "STATUS: DONE" : "STATUS: PENDING") : "LOADING..."}
                </span>

                <span className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-bold text-black shadow-[3px_3px_0_0_#000]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {data
                      ? `${data.nextSchedule.targetTimeWib} (${data.nextSchedule.label})`
                      : "Jadwal: —"}
                  </span>
                  {data && (
                    <span className="ml-1 border border-black bg-[#B8A9FA] px-1.5 py-0.5 text-[10px] font-extrabold text-black">
                      {data.mode}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Bold Primary Brutalist Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-2 bg-white px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{syncing ? "Syncing..." : "Sync Repos"}</span>
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={generating}
              className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-2 bg-[#88D498] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{generating ? "Generating..." : "Generate Suggestions"}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
