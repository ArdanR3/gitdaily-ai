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
  Terminal,
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
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-[var(--color-card)] transition-colors duration-200 ${
        isExecuted
          ? "border-emerald-500/40"
          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border)]"
      }`}
    >
      {/* Top Semantic Accent Strip */}
      <div
        aria-hidden="true"
        className={`h-0.5 w-full ${
          isExecuted
            ? "bg-emerald-500"
            : isCreate
              ? "bg-gradient-to-r from-violet-500 via-fuchsia-500/70 to-transparent"
              : "bg-gradient-to-r from-sky-500 via-cyan-400/70 to-transparent"
        }`}
      />

      <div className="flex flex-1 flex-col p-5">
        {/* Badge & Visibility Row */}
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium ${
              isCreate
                ? "border-violet-500/35 bg-violet-500/10 text-violet-300"
                : "border-sky-500/35 bg-sky-500/10 text-sky-300"
            }`}
          >
            {isCreate ? (
              <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isCreate ? "CREATE_REPO" : "UPDATE_REPO"}
          </span>

          {isCreate && suggestion.status === "PENDING" && (
            <div
              role="group"
              aria-label="Visibility repository baru"
              className="inline-flex rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-0.5 text-[11px]"
            >
              <button
                type="button"
                disabled={updatingVis}
                aria-pressed={suggestion.visibility === "public"}
                onClick={() => handleToggleVisibility("public")}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 transition-colors duration-150 ${
                  suggestion.visibility === "public"
                    ? "bg-[var(--color-secondary)] font-medium text-white"
                    : "text-slate-400 hover:text-slate-200"
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
                className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 transition-colors duration-150 ${
                  suggestion.visibility === "private"
                    ? "bg-[var(--color-secondary)] font-medium text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Lock className="h-3 w-3" aria-hidden="true" />
                Private
              </button>
            </div>
          )}

          {isExecuted && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              EXECUTED
            </span>
          )}
        </div>

        {/* Target Repository */}
        <h3 className="truncate font-mono text-base font-semibold tracking-tight text-[var(--color-foreground)]">
          {suggestion.targetRepo}
        </h3>

        {/* Terminal Commit Message Strip */}
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs text-emerald-300">
          <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          <span className="break-words leading-relaxed">{suggestion.title}</span>
        </div>

        {/* AI Reasoning */}
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{suggestion.reasoning}</p>

        {/* File Manifest */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <span>Changed Files</span>
            <span className="font-mono text-slate-300">{files.length} file</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {files.map((f) => (
              <span
                key={f.path}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-2 py-1 font-mono text-[11px] text-slate-200"
              >
                <FileCode2 className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                <span className="truncate">{f.path}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-border-subtle)] bg-[#0A0E1C] px-5 py-3.5 sm:flex-row">
        <button
          type="button"
          onClick={() => onPreview(suggestion)}
          className="inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3.5 py-2 text-xs font-medium text-slate-100 transition-colors duration-200 hover:border-slate-500 hover:bg-[var(--color-secondary)]"
        >
          <Code2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
          Preview & Edit Code
        </button>

        <button
          type="button"
          disabled={!canExecute}
          onClick={handleApproveClick}
          className="inline-flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400"
        >
          {executing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {executing ? "Pushing..." : isExecuted ? "Sudah Push" : "Approve & Push"}
        </button>
      </div>
    </article>
  );
}
