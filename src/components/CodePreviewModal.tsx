"use client";

import { useState } from "react";
import { X, FileCode2, Save, Loader2 } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#30363d] bg-[#161b22] shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-[#30363d] px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-[#f0f6fc]">
              Preview & Edit — <span className="font-mono text-[#58a6ff]">{suggestion.targetRepo}</span>
            </h3>
            <p className="text-xs text-[#8b949e]">Edit commit message atau isi file sebelum di-push ke GitHub.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8b949e] transition hover:bg-[#21262d] hover:text-[#f0f6fc]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metadata Inputs */}
        <div className="grid gap-3 border-b border-[#30363d] bg-[#0d1117]/60 px-4 py-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#8b949e]">Commit Message</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 font-mono text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
            />
          </div>
          {suggestion.type === "CREATE_REPO" && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#8b949e]">Nama Repository Baru</label>
              <input
                type="text"
                value={targetRepo}
                onChange={(e) => setTargetRepo(e.target.value)}
                className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 font-mono text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
              />
            </div>
          )}
          {suggestion.type === "CREATE_REPO" && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-[#8b949e]">Deskripsi Repository</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-2.5 py-1.5 text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
              />
            </div>
          )}
        </div>

        {/* File Tabs + Code Editor */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#30363d] bg-[#0d1117] p-2 sm:w-56 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r">
            {files.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-mono text-xs transition ${
                  idx === activeIndex
                    ? "bg-[#1f6feb]/20 text-[#58a6ff]"
                    : "text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]"
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[#0d1117]">
            {activeFile ? (
              <textarea
                value={activeFile.content}
                onChange={(e) => updateActiveContent(e.target.value)}
                spellCheck={false}
                className="h-80 w-full flex-1 resize-none bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-[#e6edf3] outline-none sm:h-[420px]"
              />
            ) : (
              <div className="p-6 text-xs text-[#8b949e]">Tidak ada file untuk ditampilkan.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#30363d] bg-[#161b22] px-4 py-3">
          <div className="text-xs text-[#ff7b72]">{error}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#238636] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#2ea043] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
