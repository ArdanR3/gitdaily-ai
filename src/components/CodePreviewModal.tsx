"use client";

import { useEffect, useState } from "react";
import { X, FileCode2, Save, Loader2, Code2 } from "lucide-react";
import type { GeneratedFile } from "@/types";

export interface SuggestionItem {
  id: number;
  dateKey: string;
  type: "CREATE_REPO" | "UPDATE_REPO";
  targetRepo: string;
  visibility: "public" | "private";
  title: string;
  description: string | null;
  reasoning: string;
  filesJson: string;
  status: string;
}

interface CodePreviewModalProps {
  suggestion: SuggestionItem;
  onClose: () => void;
  onSaved: (updated: SuggestionItem) => void;
}

export function CodePreviewModal({ suggestion, onClose, onSaved }: CodePreviewModalProps) {
  const initialFiles: GeneratedFile[] = (() => {
    try {
      return JSON.parse(suggestion.filesJson) as GeneratedFile[];
    } catch {
      return [];
    }
  })();

  const [title, setTitle] = useState(suggestion.title);
  const [targetRepo, setTargetRepo] = useState(suggestion.targetRepo);
  const [description, setDescription] = useState(suggestion.description || "");
  const [files, setFiles] = useState<GeneratedFile[]>(initialFiles);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFile = files[activeIndex];
  const lineCount = activeFile ? activeFile.content.split("\n").length : 0;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  function updateActiveContent(newContent: string) {
    setFiles((prev) => prev.map((f, idx) => (idx === activeIndex ? { ...f, content: newContent } : f)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetRepo: suggestion.type === "CREATE_REPO" ? targetRepo : undefined,
          description: suggestion.type === "CREATE_REPO" ? description : undefined,
          files,
        }),
      });
      const data = (await res.json()) as { suggestion?: SuggestionItem; error?: string };
      if (!res.ok || !data.suggestion) {
        setError(data.error || "Gagal menyimpan perubahan.");
        return;
      }
      onSaved(data.suggestion);
      onClose();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="code-preview-title" className="truncate font-mono text-sm font-semibold text-slate-100">
                Preview & Edit — <span className="text-emerald-400">{suggestion.targetRepo}</span>
              </h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Review commit message dan isi file sebelum di-push ke GitHub. Tekan Esc untuk menutup.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup modal preview kode"
            onClick={onClose}
            className="ml-2 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors duration-150 hover:bg-[var(--color-muted)] hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Metadata Inputs */}
        <div className="grid gap-3 border-b border-[var(--color-border-subtle)] bg-[#0A0E1C] px-4 py-3.5 sm:grid-cols-2 sm:px-5">
          <div>
            <label htmlFor="preview-commit-msg" className="mb-1 block text-[11px] font-medium text-slate-300">
              Commit Message
            </label>
            <input
              id="preview-commit-msg"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs text-slate-100 transition-colors focus:border-emerald-500"
            />
          </div>

          {suggestion.type === "CREATE_REPO" && (
            <div>
              <label htmlFor="preview-repo-name" className="mb-1 block text-[11px] font-medium text-slate-300">
                Nama Repository Baru
              </label>
              <input
                id="preview-repo-name"
                type="text"
                value={targetRepo}
                onChange={(e) => setTargetRepo(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs text-slate-100 transition-colors focus:border-emerald-500"
              />
            </div>
          )}

          {suggestion.type === "CREATE_REPO" && (
            <div className="sm:col-span-2">
              <label htmlFor="preview-repo-desc" className="mb-1 block text-[11px] font-medium text-slate-300">
                Deskripsi Repository
              </label>
              <input
                id="preview-repo-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background)] px-3 py-2 text-xs text-slate-100 transition-colors focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* File Tabs + Code Editor */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div
            role="tablist"
            aria-label="Daftar file kode"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--color-border-subtle)] bg-[var(--color-background)] p-2.5 sm:w-60 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r"
          >
            {files.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                onClick={() => setActiveIndex(idx)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-xs transition-colors duration-150 ${
                  idx === activeIndex
                    ? "border border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                    : "border border-transparent text-slate-400 hover:bg-[var(--color-card)] hover:text-slate-200"
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[var(--color-background)]">
            {activeFile ? (
              <>
                <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[#0A0E1C] px-4 py-1.5 font-mono text-[11px] text-slate-400">
                  <span className="truncate">{activeFile.path}</span>
                  <span className="shrink-0">{lineCount} baris</span>
                </div>
                <textarea
                  aria-label={`Editor konten ${activeFile.path}`}
                  value={activeFile.content}
                  onChange={(e) => updateActiveContent(e.target.value)}
                  spellCheck={false}
                  className="h-80 w-full flex-1 resize-none bg-[var(--color-background)] p-4 font-mono text-xs leading-relaxed text-slate-100 focus:outline-none sm:h-[420px]"
                />
              </>
            ) : (
              <div className="p-6 text-xs text-[var(--color-muted-foreground)]">
                Tidak ada file untuk ditampilkan.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-card)] px-4 py-3.5 sm:px-5">
          <div role="alert" className="text-xs font-medium text-red-300">
            {error}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors duration-200 hover:bg-[var(--color-secondary)]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
