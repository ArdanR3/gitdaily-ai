"use client";

import { useState } from "react";
import {
  FolderPlus,
  GitCommitHorizontal,
  FileCode2,
  Globe,
  Lock,
  Code2,
  Rocket,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { GeneratedFile } from "@/types";
import type { SuggestionItem } from "./CodePreviewModal";

interface SuggestionCardProps {
  suggestion: SuggestionItem;
  executedToday: boolean;
  onPreview: (s: SuggestionItem) => void;
  onVisibilityChange: (id: number, visibility: "public" | "private") => Promise<void>;
  onExecute: (id: number) => Promise<void>;
}

export function SuggestionCard({
  suggestion,
  executedToday,
  onPreview,
  onVisibilityChange,
  onExecute,
}: SuggestionCardProps) {
  const [executing, setExecuting] = useState(false);
  const [updatingVis, setUpdatingVis] = useState(false);

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

  async function handleToggleVisibility(next: "public" | "private") {
    if (next === suggestion.visibility || updatingVis) return;
    setUpdatingVis(true);
    try {
      await onVisibilityChange(suggestion.id, next);
    } finally {
      setUpdatingVis(false);
    }
  }

  async function handleApproveClick() {
    if (!canExecute) return;
    const actionLabel = isCreate
      ? `membuat repository ${suggestion.visibility.toUpperCase()} baru "${suggestion.targetRepo}"`
      : `push commit ke repository "${suggestion.targetRepo}"`;
    if (!window.confirm(`Konfirmasi: lanjutkan ${actionLabel} di akun ArdanR3?`)) return;

    setExecuting(true);
    try {
      await onExecute(suggestion.id);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#30363d] bg-[#161b22] p-5 transition hover:border-[#484f58]">
      <div>
        {/* Badge Row */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isCreate
                ? "border border-[#a371f7]/40 bg-[#a371f7]/15 text-[#d2a8ff]"
                : "border border-[#58a6ff]/40 bg-[#58a6ff]/15 text-[#79c0ff]"
            }`}
          >
            {isCreate ? <FolderPlus className="h-3.5 w-3.5" /> : <GitCommitHorizontal className="h-3.5 w-3.5" />}
            {isCreate ? "Buat Repo Baru" : "Update Repo Lama"}
          </span>

          {isCreate && suggestion.status === "PENDING" && (
            <div className="inline-flex rounded-lg border border-[#30363d] bg-[#0d1117] p-0.5 text-[11px]">
              <button
                type="button"
                disabled={updatingVis}
                onClick={() => handleToggleVisibility("public")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${
                  suggestion.visibility === "public"
                    ? "bg-[#21262d] font-medium text-[#f0f6fc]"
                    : "text-[#8b949e] hover:text-[#c9d1d9]"
                }`}
              >
                <Globe className="h-3 w-3" />
                Public
              </button>
              <button
                type="button"
                disabled={updatingVis}
                onClick={() => handleToggleVisibility("private")}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${
                  suggestion.visibility === "private"
                    ? "bg-[#21262d] font-medium text-[#f0f6fc]"
                    : "text-[#8b949e] hover:text-[#c9d1d9]"
                }`}
              >
                <Lock className="h-3 w-3" />
                Private
              </button>
            </div>
          )}

          {isExecuted && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3fb950]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Dieksekusi
            </span>
          )}
        </div>

        {/* Target Repo & Commit Title */}
        <h3 className="font-mono text-base font-semibold text-[#f0f6fc]">{suggestion.targetRepo}</h3>
        <p className="mt-1 rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 font-mono text-xs text-[#79c0ff]">
          {suggestion.title}
        </p>

        {/* Reasoning */}
        <p className="mt-3 text-xs leading-relaxed text-[#8b949e]">{suggestion.reasoning}</p>

        {/* Files List */}
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#6e7681]">
            File ({files.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {files.map((f) => (
              <span
                key={f.path}
                className="inline-flex items-center gap-1 rounded-md border border-[#30363d] bg-[#0d1117] px-2 py-0.5 font-mono text-[11px] text-[#c9d1d9]"
              >
                <FileCode2 className="h-3 w-3 text-[#8b949e]" />
                {f.path}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#30363d] pt-4">
        <button
          type="button"
          onClick={() => onPreview(suggestion)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-xs font-medium text-[#c9d1d9] transition hover:border-[#8b949e] hover:bg-[#30363d]"
        >
          <Code2 className="h-3.5 w-3.5" />
          Preview & Edit Code
        </button>

        <button
          type="button"
          disabled={!canExecute}
          onClick={handleApproveClick}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#238636] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
          {executing ? "Pushing..." : isExecuted ? "Sudah Push" : "Approve & Push"}
        </button>
      </div>
    </div>
  );
}
