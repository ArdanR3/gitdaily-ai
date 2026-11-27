"use client";

import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
  UserCheck,
  ScrollText,
  GitCommitHorizontal,
} from "lucide-react";

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
    <section aria-labelledby="activity-log-heading" className="nb-card flex flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-2 border-b-3 border-black pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#B8A9FA] text-black">
            <ScrollText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="activity-log-heading"
              className="font-display text-base font-extrabold uppercase text-black"
            >
              Quest Activity Log
            </h2>
            <p className="text-xs font-medium text-black/75">
              Riwayat misi commit harian ke akun GitHub @ArdanR3.
            </p>
          </div>
        </div>

        <span className="shrink-0 border-2 border-black bg-[#74B9FF] px-2.5 py-1 font-mono text-xs font-extrabold text-black">
          {logs.length} LOG
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center border-2 border-dashed border-black bg-[#F5F0E8] px-4 py-12 text-center">
          <GitCommitHorizontal className="mb-2 h-7 w-7 text-black" aria-hidden="true" />
          <p className="text-sm font-extrabold uppercase text-black">Belum ada riwayat misi</p>
          <p className="mt-1 text-xs font-medium text-black/75">
            Approve Featured Quest pertamamu di atas untuk mulai mencatat streak!
          </p>
        </div>
      ) : (
        <ol className="relative max-h-[430px] space-y-3 overflow-y-auto overscroll-contain pl-6 pr-1 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-[3px] before:bg-black">
          {logs.map((log) => {
            const isSuccess = log.status === "SUCCESS";
            const isAutopilot = log.triggeredBy === "AUTOPILOT";

            return (
              <li key={log.id} className="relative">
                {/* Square Brutalist Timeline Node */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-6 top-4 h-4 w-4 border-2 border-black ${
                    isSuccess ? "bg-[#88D498]" : "bg-[#FF6B6B]"
                  }`}
                />

                <div className="flex flex-col gap-2.5 border-2 border-black bg-[#FFFDF5] p-3.5 shadow-[4px_4px_0_0_#000] sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#15803D]" aria-label="Berhasil" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-[#DC2626]" aria-label="Gagal" />
                      )}
                      <span className="break-all font-mono text-xs font-extrabold text-black">
                        {log.repoName}
                      </span>
                      <span className="border border-black bg-[#FFD23F] px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">
                        {log.dateKey}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 border border-black px-1.5 py-0.5 font-mono text-[10px] font-bold text-black ${
                          isAutopilot ? "bg-[#B8A9FA]" : "bg-[#74B9FF]"
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

                    <p className="line-clamp-2 break-words font-mono text-xs font-semibold text-black/80">
                      {log.commitMessage}
                    </p>
                    {log.errorMessage && (
                      <p className="break-words text-xs font-bold text-[#DC2626]">{log.errorMessage}</p>
                    )}
                  </div>

                  {log.commitUrl && (
                    <a
                      href={log.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="nb-btn-sm inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 self-start bg-white px-3 py-1 font-mono text-[11px] font-extrabold text-black sm:min-h-[34px] sm:self-center"
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
