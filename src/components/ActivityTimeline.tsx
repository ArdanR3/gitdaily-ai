"use client";

import { CheckCircle2, XCircle, ExternalLink, Bot, UserCheck, Activity, GitCommitHorizontal } from "lucide-react";

export interface ActivityLogItem {
  id: number;
  dateKey: string;
  actionType: string;
  repoName: string;
  commitMessage: string;
  commitSha: string | null;
  commitUrl: string | null;
  triggeredBy: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

interface ActivityTimelineProps {
  logs: ActivityLogItem[];
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  return (
    <section
      aria-labelledby="activity-log-heading"
      className="flex flex-col rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <h2 id="activity-log-heading" className="font-mono text-sm font-semibold text-[var(--color-foreground)]">
              Activity Log
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Riwayat eksekusi harian yang dikirim ke akun GitHub @ArdanR3.
          </p>
        </div>

        <span className="shrink-0 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-2 py-0.5 font-mono text-[11px] text-slate-300">
          {logs.length} log
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-10 text-center">
          <GitCommitHorizontal className="mb-2 h-6 w-6 text-slate-500" aria-hidden="true" />
          <p className="text-xs font-medium text-slate-300">Belum ada riwayat push</p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Approve saran harian pertama kamu untuk mulai mencatat streak.
          </p>
        </div>
      ) : (
        <ol className="relative max-h-[420px] space-y-3 overflow-y-auto pl-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-[var(--color-border-subtle)]">
          {logs.map((log) => {
            const isSuccess = log.status === "SUCCESS";
            const isAutopilot = log.triggeredBy === "AUTOPILOT";

            return (
              <li key={log.id} className="relative">
                {/* Timeline Status Node */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-5 top-4 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[var(--color-card)] ${
                    isSuccess ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />

                <div className="flex flex-col gap-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-3.5 transition-colors duration-150 hover:border-[var(--color-border)] sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Berhasil" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-400" aria-label="Gagal" />
                      )}
                      <span className="truncate font-mono text-xs font-semibold text-slate-100">{log.repoName}</span>
                      <span className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                        {log.dateKey}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                          isAutopilot
                            ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                            : "border-sky-500/30 bg-sky-500/10 text-sky-300"
                        }`}
                      >
                        {isAutopilot ? (
                          <Bot className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <UserCheck className="h-3 w-3" aria-hidden="true" />
                        )}
                        {isAutopilot ? "Auto-Pilot" : "Manual"}
                      </span>
                    </div>

                    <p className="truncate font-mono text-xs text-slate-300">{log.commitMessage}</p>
                    {log.errorMessage && <p className="text-xs text-red-300">{log.errorMessage}</p>}
                  </div>

                  {log.commitUrl && (
                    <a
                      href={log.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[34px] shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card)] px-2.5 py-1.5 font-mono text-[11px] font-medium text-sky-400 transition-colors duration-200 hover:border-sky-500/60 hover:text-sky-300 sm:self-center"
                    >
                      <span>{log.commitSha ? log.commitSha.slice(0, 7) : "Commit"}</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
