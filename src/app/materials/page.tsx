"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileUp,
  Trash2,
  Power,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { KnowledgeChunkerFigure } from "@/components/figures/knowledge-chunker/KnowledgeChunkerFigure";

interface StudyMaterialItem {
  id: number;
  title: string;
  sourceType: string;
  totalChunks: number;
  currentChunkIndex: number;
  charCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<"PDF" | "MARKDOWN" | "CODE" | "TEXT">("PDF");
  const [content, setContent] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/materials");
      if (!res.ok) return;
      const data = (await res.json()) as { materials: StudyMaterialItem[] };
      setMaterials(data.materials || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  async function extractPdfTextClientSide(file: File): Promise<string> {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const buffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buffer }).promise;
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim();
      if (pageText) pages.push(pageText);
    }

    return pages.join("\n\n");
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAlert(null);
    setExtracting(true);
    try {
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      }

      const lower = file.name.toLowerCase();
      if (lower.endsWith(".pdf")) {
        setSourceType("PDF");
        const text = await extractPdfTextClientSide(file);
        if (!text.trim()) {
          setAlert({
            type: "error",
            text: "PDF tidak memiliki teks yang dapat dibaca (kemungkinan hasil scan gambar).",
          });
          return;
        }
        setContent(text);
        setAlert({
          type: "success",
          text: `Berhasil mengekstrak ${text.length.toLocaleString("id-ID")} karakter dari PDF.`,
        });
      } else {
        const text = await file.text();
        if (lower.endsWith(".md")) setSourceType("MARKDOWN");
        else if (/\.(ts|tsx|js|jsx|py|cs|cpp|c|java|go|rs)$/.test(lower)) setSourceType("CODE");
        else setSourceType("TEXT");

        setContent(text);
        setAlert({
          type: "success",
          text: `Berhasil membaca ${text.length.toLocaleString("id-ID")} karakter dari ${file.name}.`,
        });
      }
    } catch (err) {
      setAlert({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal mengekstrak isi file.",
      });
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceType, content }),
      });
      const data = (await res.json()) as { material?: StudyMaterialItem; error?: string };
      if (!res.ok || !data.material) {
        setAlert({ type: "error", text: data.error || "Gagal menyimpan materi." });
        return;
      }
      setMaterials((prev) => [data.material!, ...prev]);
      setTitle("");
      setContent("");
      setAlert({
        type: "success",
        text: `Materi "${data.material.title}" disimpan (${data.material.totalChunks} chunk siap dipelajari AI).`,
      });
    } catch {
      setAlert({ type: "error", text: "Kesalahan jaringan saat menyimpan materi." });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: StudyMaterialItem) {
    const res = await fetch(`/api/materials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { material: StudyMaterialItem };
    setMaterials((prev) => prev.map((m) => (m.id === item.id ? data.material : m)));
  }

  async function handleResetProgress(item: StudyMaterialItem) {
    const res = await fetch(`/api/materials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetProgress: true }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { material: StudyMaterialItem };
    setMaterials((prev) => prev.map((m) => (m.id === item.id ? data.material : m)));
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Hapus materi belajar ini?")) return;
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  }

  const activeMaterials = materials.filter((m) => m.isActive);
  const activeCount = activeMaterials.length;
  const totalChunks = materials.reduce((acc, m) => acc + m.totalChunks, 0);
  const totalChars = materials.reduce((acc, m) => acc + m.charCount, 0);
  const primaryMaterial = activeMaterials[0] ?? materials[0] ?? null;

  return (
    <div className="nb-grid-bg min-h-screen">
      <header className="border-b-4 border-black bg-[#B8A9FA] text-black">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-white px-4 py-1.5 text-xs font-extrabold uppercase text-black sm:min-h-[38px]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 border-2 border-black bg-[#FFD23F] px-3 py-1 font-mono text-[11px] font-extrabold text-black shadow-[3px_3px_0_0_#000]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {activeCount} ACTIVE CODEX
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border-3 border-black bg-[#FFD23F] text-black shadow-[4px_4px_0_0_#000]">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-black sm:text-3xl">
                Study Materials · Codex
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-black/80 sm:text-sm">
                Upload PDF, Markdown, atau kode sumber untuk memberi bahan belajar AI di Stage 02.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {alert && (
          <div
            role="status"
            className={`flex items-center gap-2.5 border-3 border-black px-4 py-3 text-xs font-extrabold text-black shadow-[5px_5px_0_0_#000] ${
              alert.type === "success" ? "bg-[#88D498]" : "bg-[#FF6B6B]"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
        )}

        <KnowledgeChunkerFigure
          telemetry={{
            activeMaterialsCount: activeCount,
            totalMaterialsCount: materials.length,
            totalChunks,
            totalChars,
            extracting,
            primaryMaterial: primaryMaterial
              ? {
                  title: primaryMaterial.title,
                  sourceType: primaryMaterial.sourceType,
                  currentChunkIndex: primaryMaterial.currentChunkIndex,
                  totalChunks: primaryMaterial.totalChunks,
                }
              : null,
          }}
        />

        <section className="nb-card p-5 sm:p-6">
          <h2 className="font-display text-base font-extrabold uppercase text-black">
            Tambah Materi Belajar (PDF / Kode / Catatan)
          </h2>
          <p className="mt-1 text-xs font-medium text-black/75">
            Teks PDF diekstrak langsung di browser, dipecah per ~3.000 karakter, lalu disuntikkan ke AI setiap hari.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="mat-title" className="mb-1.5 block text-xs font-extrabold uppercase text-black">
                  Judul Materi
                </label>
                <input
                  id="mat-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mis. Modul Struktur Data / Unity Design Patterns"
                  className="nb-input w-full px-3.5 py-2.5 text-base font-bold placeholder-black/65 sm:text-xs"
                />
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-extrabold uppercase text-black">Upload File</span>
                <label className="nb-btn-sm flex min-h-[44px] cursor-pointer items-center justify-center gap-2 bg-[#FFD23F] px-3 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[42px]">
                  {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  <span>{extracting ? "Membaca..." : "Pilih PDF / TXT"}</span>
                  <input
                    type="file"
                    accept=".pdf,.md,.txt,.ts,.tsx,.js,.py,.cs,.cpp,.c,.java"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="mat-content" className="text-xs font-extrabold uppercase text-black">
                  Isi Materi ({content.length.toLocaleString("id-ID")} karakter)
                </label>
                <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[10px] font-bold text-[#FFD23F]">
                  TYPE: {sourceType}
                </span>
              </div>
              <textarea
                id="mat-content"
                required
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Upload file PDF/kode di atas atau paste langsung catatan materi di sini..."
                className="nb-input w-full p-3.5 font-mono text-base font-medium placeholder-black/65 sm:text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || extracting || !title.trim() || !content.trim()}
                className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-2 bg-[#88D498] px-5 py-2 text-xs font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                <span>{saving ? "Menyimpan..." : "Simpan ke Knowledge Base"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Saved Materials List */}
        <section className="nb-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-black pb-3.5">
            <div>
              <h2 className="font-display text-base font-extrabold uppercase text-black">
                Daftar Materi Tersimpan
              </h2>
              <p className="mt-0.5 text-xs font-medium text-black/75">
                Setiap kali Generate Suggestions dijalankan, materi Active maju 1 chunk otomatis.
              </p>
            </div>
            <span className="border-2 border-black bg-[#FFD23F] px-2.5 py-1 font-mono text-xs font-extrabold text-black">
              {materials.length} MATERI
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs font-bold text-black">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat materi...
            </div>
          ) : materials.length === 0 ? (
            <div className="mt-4 border-2 border-dashed border-black bg-[#F5F0E8] py-10 text-center text-xs font-bold text-black/75">
              Belum ada materi. Upload PDF atau catatan pertamamu di atas!
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {materials.map((m) => {
                const currentChunk = (m.currentChunkIndex % Math.max(m.totalChunks, 1)) + 1;
                const progressPct = Math.round((currentChunk / Math.max(m.totalChunks, 1)) * 100);

                return (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 border-2 border-black bg-[#FFFDF5] p-4 shadow-[4px_4px_0_0_#000] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-extrabold text-black">{m.title}</span>
                        <span className="border border-black bg-[#B8A9FA] px-2 py-0.5 font-mono text-[10px] font-extrabold text-black">
                          {m.sourceType}
                        </span>
                        <span className="border border-black bg-[#74B9FF] px-2 py-0.5 font-mono text-[10px] font-extrabold text-black">
                          Chunk {currentChunk} / {m.totalChunks}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-3 max-w-[200px] flex-1 overflow-hidden border-2 border-black bg-white">
                          <div className="h-full bg-[#88D498]" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-black/75">
                          {m.charCount.toLocaleString("id-ID")} karakter
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetProgress(m)}
                        title="Ulangi dari Chunk 1"
                        aria-label={`Reset progress ${m.title}`}
                        className="nb-btn-sm inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center bg-white p-2 text-black sm:min-h-[34px] sm:min-w-[34px]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(m)}
                        className={`nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-extrabold uppercase text-black sm:min-h-[34px] ${
                          m.isActive ? "bg-[#88D498]" : "bg-[#F5F0E8]"
                        }`}
                      >
                        <Power className="h-3 w-3" aria-hidden="true" />
                        <span>{m.isActive ? "Active" : "Paused"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        title="Hapus materi"
                        aria-label={`Hapus materi ${m.title}`}
                        className="nb-btn-sm inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center bg-[#FF6B6B] p-2 text-black sm:min-h-[34px] sm:min-w-[34px]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
