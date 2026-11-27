"use client";

import { useEffect, useState } from "react";
import {
  FolderPlus,
  GitCommitHorizontal,
  GitBranch,
  GitPullRequest,
  FileCode2,
  Globe,
  Lock,
  Code2,
  Rocket,
  Loader2,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import type { GeneratedFile, PushMode } from "@/types";
import type { SuggestionItem } from "./CodePreviewModal";

interface SuggestionCardProps {
  suggestion: SuggestionItem;
  executedToday: boolean;
  defaultPushMode: PushMode;
  onPreview: (s: SuggestionItem) => void;
  onVisibilityChange: (id: number, visibility: "public" | "private") => Promise<void>;
  onExecute: (id: number, pushMode?: PushMode) => Promise<void>;
}

export function SuggestionCard({
  suggestion,
  executedToday,
  defaultPushMode,
  onPreview,
  onVisibilityChange,
  onExecute,
}: SuggestionCardProps) {
  const [executing, setExecuting] = useState(false);
  const [updatingVis, setUpdatingVis] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pushMode, setPushMode] = useState<PushMode>(defaultPushMode);

  useEffect(() => {
    setPushMode(defaultPushMode);
  }, [defaultPushMode]);

  const files: GeneratedFile[] = (() => {
    try {
      return JSON.parse(suggestion.filesJson) as GeneratedFile[];
    } catch {
      return [];
    }
  })();

  const isCreate = suggestion.type === "CREATE_REPO";
  const isExecuted = suggestion.status === "EXECUTED";
  const canExecute = !executedToday && suggestion.status === "PENDING" && !executing;
  const isBranchPr = !isCreate && pushMode === "BRANCH_PR";

  async function handleToggleVisibility(next: "public" | "private") {
    if (next === suggestion.visibility || updatingVis) return;
    setUpdatingVis(true);
    try {
      await onVisibilityChange(suggestion.id, next);
    } finally {
      setUpdatingVis(false);
    }
  }

  async function handleConfirmPush() {
    if (!canExecute) return;
    setConfirming(false);
    setExecuting(true);
    try {
      await onExecute(suggestion.id, isCreate ? undefined : pushMode);
    } finally {
      setExecuting(false);
    }
  }

  const headerBg = isExecuted
    ? "bg-[#88D498]"
    : isCreate
      ? "bg-[#B8A9FA]"
      : "bg-[#74B9FF]";

  return (
    <article className="nb-card flex flex-col justify-between transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#000]">
      <div>
        <div className={`border-b-3 border-black px-5 py-4 ${headerBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1 font-mono text-[11px] font-extrabold uppercase text-black">
              {isCreate ? (
                <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isCreate ? "NEW REPO" : "UPDATE REPO"}
            </span>

            {isCreate && suggestion.status === "PENDING" && (
              <div
                role="group"
                aria-label="Visibility repository baru"
                className="inline-flex border-2 border-black bg-white p-0.5 text-[11px]"
              >
                <button
                  type="button"
                  disabled={updatingVis}
                  aria-pressed={suggestion.visibility === "public"}
                  onClick={() => handleToggleVisibility("public")}
                  className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1 px-2.5 py-1 font-bold uppercase sm:min-h-[28px] ${
                    suggestion.visibility === "public"
                      ? "bg-black text-[#FFD23F]"
                      : "bg-white text-black hover:bg-[#FFF3C4]"
                  }`}
                >
                  <Globe className="h-3 w-3" aria-hidden="true" />
                  Public
                </button>
                <button
                  type="button"
                  disabled={updatingVis}
                  aria-pressed={suggestion.visibility === "private"}
                  onClick={() => handleToggleVisibility("private")}
                  className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1 px-2.5 py-1 font-bold uppercase sm:min-h-[28px] ${
                    suggestion.visibility === "private"
                      ? "bg-black text-[#FFD23F]"
                      : "bg-white text-black hover:bg-[#FFF3C4]"
                  }`}
                >
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  Private
                </button>
              </div>
            )}

            {!isCreate && suggestion.status === "PENDING" && (
              <div
                role="group"
                aria-label="Mode push untuk update repository"
                className="inline-flex border-2 border-black bg-white p-0.5 text-[11px]"
              >
                <button
                  type="button"
                  aria-pressed={pushMode === "DIRECT_MAIN"}
                  onClick={() => setPushMode("DIRECT_MAIN")}
                  className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1 px-2.5 py-1 font-bold uppercase sm:min-h-[28px] ${
                    pushMode === "DIRECT_MAIN"
                      ? "bg-black text-[#88D498]"
                      : "bg-white text-black hover:bg-[#FFF3C4]"
                  }`}
                >
                  <GitBranch className="h-3 w-3" aria-hidden="true" />
                  Main
                </button>
                <button
                  type="button"
                  aria-pressed={pushMode === "BRANCH_PR"}
                  onClick={() => setPushMode("BRANCH_PR")}
                  className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1 px-2.5 py-1 font-bold uppercase sm:min-h-[28px] ${
                    pushMode === "BRANCH_PR"
                      ? "bg-black text-[#FFD23F]"
                      : "bg-white text-black hover:bg-[#FFF3C4]"
                  }`}
                >
                  <GitPullRequest className="h-3 w-3" aria-hidden="true" />
                  Branch + PR
                </button>
              </div>
            )}

            {isExecuted && (
              <span className="inline-flex items-center gap-1 border-2 border-black bg-black px-2.5 py-1 font-mono text-[11px] font-extrabold text-[#88D498]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                CLEARED
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate font-mono text-lg font-extrabold tracking-tight text-black">
            {suggestion.targetRepo}
          </h3>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-2 border-2 border-black bg-black px-3.5 py-2.5 font-mono text-xs font-bold text-[#FFD23F]">
            <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#88D498]" aria-hidden="true" />
            <span className="break-words leading-relaxed">{suggestion.title}</span>
          </div>

          <p className="mt-3.5 text-sm font-medium leading-relaxed text-black/85">
            {suggestion.reasoning}
          </p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-black">
              <span>Changed Files</span>
              <span className="border-2 border-black bg-[#FFD23F] px-2 py-0.5 font-mono text-[11px] font-extrabold text-black">
                {files.length} file
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {files.map((f) => (
                <span
                  key={f.path}
                  className="inline-flex max-w-full items-center gap-1.5 border-2 border-black bg-[#F5F0E8] px-2.5 py-1 font-mono text-[11px] font-bold text-black"
                >
                  <FileCode2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{f.path}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-3 border-black bg-[#F5F0E8] px-5 py-4">
        {confirming ? (
          <div
            role="region"
            aria-label="Konfirmasi push ke GitHub"
            className="space-y-3 border-2 border-black bg-[#FFF3C4] p-3.5 shadow-[4px_4px_0_0_#000]"
          >
            <p className="text-xs font-extrabold leading-relaxed text-black">
              {isCreate
                ? `Buat repository ${suggestion.visibility.toUpperCase()} baru "${suggestion.targetRepo}" di akun @ArdanR3?`
                : isBranchPr
                  ? `Buat branch baru & buka Pull Request ke repository "${suggestion.targetRepo}" di akun @ArdanR3?`
                  : `Push commit ini langsung ke branch default repository "${suggestion.targetRepo}" di akun @ArdanR3?`}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleConfirmPush}
                disabled={executing}
                className="nb-btn-sm inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-1.5 bg-[#88D498] px-3 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[38px]"
              >
                {isBranchPr ? (
                  <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isBranchPr ? "Buat PR ke ArdanR3" : "Push ke ArdanR3"}</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center justify-center bg-white px-4 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[38px]"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onPreview(suggestion)}
              className="nb-btn inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 bg-white px-4 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[42px]"
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              <span>Preview &amp; Edit</span>
            </button>

            <button
              type="button"
              disabled={!canExecute}
              onClick={() => setConfirming(true)}
              className={`nb-btn inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[42px] ${
                canExecute
                  ? isBranchPr
                    ? "cursor-pointer bg-[#FFD23F]"
                    : "cursor-pointer bg-[#88D498]"
                  : "cursor-not-allowed bg-[#E5E5E5] opacity-60 shadow-none"
              }`}
            >
              {executing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : isBranchPr ? (
                <GitPullRequest className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Rocket className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {executing
                  ? isBranchPr
                    ? "Opening PR..."
                    : "Pushing..."
                  : isExecuted
                    ? "Sudah Push"
                    : isBranchPr
                      ? "Approve & Open PR"
                      : "Approve & Push"}
              </span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
