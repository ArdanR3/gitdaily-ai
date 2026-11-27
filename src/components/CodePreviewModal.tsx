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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border-4 border-black bg-[#FFFDF5] shadow-[10px_10px_0_0_#000]">
        {/* Bold Yellow Top Bar */}
        <div className="flex items-center justify-between border-b-3 border-black bg-[#FFD23F] px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-black text-[#FFD23F]">
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="code-preview-title" className="truncate font-mono text-sm font-extrabold uppercase text-black">
                CODE FORGE — {suggestion.targetRepo}
              </h3>
              <p className="text-xs font-bold text-black/80">
                Edit commit message atau file sebelum push ke GitHub (Esc untuk tutup).
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup modal preview kode"
            onClick={onClose}
            className="nb-btn-sm ml-2 cursor-pointer bg-[#FF6B6B] p-2 text-black"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Metadata Inputs */}
        <div className="grid gap-3 border-b-3 border-black bg-[#F5F0E8] px-4 py-3.5 sm:grid-cols-2 sm:px-5">
          <div>
            <label
              htmlFor="preview-commit-msg"
              className="mb-1 block text-[11px] font-extrabold uppercase text-black"
            >
              Commit Message
            </label>
            <input
              id="preview-commit-msg"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="nb-input w-full px-3 py-2 font-mono text-xs font-bold"
            />
          </div>

          {suggestion.type === "CREATE_REPO" && (
            <div>
              <label
                htmlFor="preview-repo-name"
                className="mb-1 block text-[11px] font-extrabold uppercase text-black"
              >
                Nama Repository Baru
              </label>
              <input
                id="preview-repo-name"
                type="text"
                value={targetRepo}
                onChange={(e) => setTargetRepo(e.target.value)}
                className="nb-input w-full px-3 py-2 font-mono text-xs font-bold"
              />
            </div>
          )}

          {suggestion.type === "CREATE_REPO" && (
            <div className="sm:col-span-2">
              <label
                htmlFor="preview-repo-desc"
                className="mb-1 block text-[11px] font-extrabold uppercase text-black"
              >
                Deskripsi Repository
              </label>
              <input
                id="preview-repo-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="nb-input w-full px-3 py-2 text-xs font-bold"
              />
            </div>
          )}
        </div>

        {/* File Tabs + Code Editor */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div
            role="tablist"
            aria-label="Daftar file kode"
            className="flex shrink-0 gap-1.5 overflow-x-auto border-b-3 border-black bg-[#FFFDF5] p-2.5 sm:w-64 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r-3"
          >
            {files.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                onClick={() => setActiveIndex(idx)}
                className={`flex cursor-pointer items-center gap-2 border-2 border-black px-3 py-2 text-left font-mono text-xs font-bold transition ${
                  idx === activeIndex
                    ? "bg-black text-[#FFD23F]"
                    : "bg-white text-black hover:bg-[#FFF3C4]"
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[#14131A]">
            {activeFile ? (
              <>
                <div className="flex items-center justify-between border-b-2 border-black bg-black px-4 py-1.5 font-mono text-[11px] font-bold text-[#FFD23F]">
                  <span className="truncate">{activeFile.path}</span>
                  <span className="shrink-0 text-[#88D498]">{lineCount} baris</span>
                </div>
                <textarea
                  aria-label={`Editor konten ${activeFile.path}`}
                  value={activeFile.content}
                  onChange={(e) => updateActiveContent(e.target.value)}
                  spellCheck={false}
                  className="h-80 w-full flex-1 resize-none bg-[#14131A] p-4 font-mono text-xs leading-relaxed text-[#FFFDF5] focus:outline-none sm:h-[420px]"
                />
              </>
            ) : (
              <div className="p-6 text-xs font-bold text-white">Tidak ada file untuk ditampilkan.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-3 border-black bg-[#F5F0E8] px-4 py-3.5 sm:px-5">
          <div role="alert" className="text-xs font-extrabold text-[#DC2626]">
            {error}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="nb-btn min-h-[40px] cursor-pointer bg-white px-4 py-2 text-xs font-extrabold uppercase text-black"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="nb-btn inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 bg-[#88D498] px-4 py-2 text-xs font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50"
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
