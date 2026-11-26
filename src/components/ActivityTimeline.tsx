"use client";

import { CheckCircle2, XCircle, ExternalLink, Bot, UserCheck } from "lucide-react";

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
    <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#f0f6fc]">Activity Log</h2>
        <p className="text-xs text-[#8b949e]">Riwayat eksekusi harian ke akun GitHub @ArdanR3.</p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#30363d] py-8 text-center text-xs text-[#8b949e]">
          Belum ada riwayat push. Approve saran pertama kamu di atas!
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const isSuccess = log.status === "SUCCESS";
            return (
              <div
                key={log.id}
                className="flex flex-col gap-2 rounded-lg border border-[#30363d] bg-[#0d1117] p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isSuccess ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3fb950]" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-[#f85149]" />
                    )}
                    <span className="font-mono text-xs font-semibold text-[#f0f6fc]">{log.repoName}</span>
                    <span className="rounded bg-[#21262d] px-1.5 py-0.5 font-mono text-[10px] text-[#8b949e]">
                      {log.dateKey}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-[#21262d] px-1.5 py-0.5 text-[10px] text-[#c9d1d9]">
                      {log.triggeredBy === "AUTOPILOT" ? (
                        <Bot className="h-3 w-3 text-[#d2a8ff]" />
                      ) : (
                        <UserCheck className="h-3 w-3 text-[#58a6ff]" />
                      )}
                      {log.triggeredBy === "AUTOPILOT" ? "Auto-Pilot" : "Manual"}
                    </span>
                  </div>

                  <p className="truncate font-mono text-xs text-[#8b949e]">{log.commitMessage}</p>
                  {log.errorMessage && <p className="text-xs text-[#ff7b72]">{log.errorMessage}</p>}
                </div>

                {log.commitUrl && (
                  <a
                    href={log.commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 font-mono text-[11px] text-[#58a6ff] transition hover:border-[#58a6ff] sm:self-center"
                  >
                    {log.commitSha ? log.commitSha.slice(0, 7) : "Lihat Commit"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
