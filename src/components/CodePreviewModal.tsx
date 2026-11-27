"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CodePreviewModal({ suggestion, onClose, onSaved }: CodePreviewModalProps) {
  const initialFiles: GeneratedFile[] = (() => {
    try {
      return JSON.parse(suggestion.filesJson) as GeneratedFile[];
    } catch {
      return [];
    }
  })();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(suggestion.title);
  const [targetRepo, setTargetRepo] = useState(suggestion.targetRepo);
  const [description, setDescription] = useState(suggestion.description || "");
  const [files, setFiles] = useState<GeneratedFile[]>(initialFiles);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFile = files[activeIndex];
  const lineCount = activeFile ? activeFile.content.split("\n").length : 0;

  // Move focus inside dialog, trap Tab, handle Escape, lock body scroll, and restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstInputRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 overscroll-contain sm:p-6"
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden border-4 border-black bg-[#FFFDF5] shadow-[10px_10px_0_0_#000] overscroll-contain"
      >
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
            className="nb-btn-sm ml-2 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center bg-[#FF6B6B] p-2 text-black sm:min-h-[36px] sm:min-w-[36px]"
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
              ref={firstInputRef}
              id="preview-commit-msg"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="nb-input w-full px-3 py-2 font-mono text-base font-bold sm:text-xs"
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
                className="nb-input w-full px-3 py-2 font-mono text-base font-bold sm:text-xs"
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
                className="nb-input w-full px-3 py-2 text-base font-bold sm:text-xs"
              />
            </div>
          )}
        </div>

        {/* File Tabs + Code Editor */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div
            role="tablist"
            aria-label="Daftar file kode"
            className="flex shrink-0 gap-1.5 overflow-x-auto overscroll-contain border-b-3 border-black bg-[#FFFDF5] p-2.5 sm:w-64 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r-3"
          >
            {files.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                onClick={() => setActiveIndex(idx)}
                className={`flex min-h-[44px] cursor-pointer items-center gap-2 border-2 border-black px-3 py-2 text-left font-mono text-xs font-bold transition-colors duration-150 sm:min-h-[36px] ${
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
                  className="h-80 w-full flex-1 resize-none overscroll-contain bg-[#14131A] p-4 font-mono text-base leading-relaxed text-[#FFFDF5] focus:outline-none sm:h-[420px] sm:text-xs"
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
              className="nb-btn min-h-[44px] cursor-pointer bg-white px-4 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[40px]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#88D498] px-4 py-2 text-xs font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[40px]"
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
      </motion.div>
    </motion.div>
  );
}
