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
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#30363d] bg-[#161b22]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#21262d] px-2.5 py-1.5 text-xs font-medium text-[#c9d1d9] hover:border-[#8b949e]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#a371f7]" />
              <h1 className="text-base font-semibold text-[#f0f6fc]">Study Materials · Knowledge Base</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {alert && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
              alert.type === "success"
                ? "border-[#238636]/50 bg-[#238636]/15 text-[#3fb950]"
                : "border-[#f85149]/50 bg-[#f85149]/15 text-[#ff7b72]"
            }`}
          >
            {alert.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{alert.text}</span>
          </div>
        )}

        {/* Upload Form */}
        <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <h2 className="text-sm font-semibold text-[#f0f6fc]">Tambah Materi Belajar (PDF / Kode / Catatan)</h2>
          <p className="mt-0.5 text-xs text-[#8b949e]">
            Teks PDF diekstrak langsung di browser, dipecah per ~3.000 karakter, lalu disuntikkan ke AI setiap hari.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-[#c9d1d9]">Judul Materi</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mis. Modul Struktur Data / Unity Design Patterns"
                  className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs text-[#f0f6fc] placeholder-[#6e7681] outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#c9d1d9]">Upload File</label>
                <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs text-[#58a6ff] transition hover:border-[#58a6ff]">
                  {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                  {extracting ? "Membaca..." : "Pilih PDF / TXT / Kode"}
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
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-[#c9d1d9]">Isi Materi ({content.length.toLocaleString("id-ID")} karakter)</label>
                <span className="rounded bg-[#21262d] px-1.5 py-0.5 font-mono text-[10px] text-[#8b949e]">
                  TYPE: {sourceType}
                </span>
              </div>
              <textarea
                required
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Upload file PDF/kode di atas atau paste langsung catatan materi di sini..."
                className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] p-3 font-mono text-xs text-[#e6edf3] placeholder-[#6e7681] outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || extracting || !title.trim() || !content.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#238636] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#2ea043] disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
                {saving ? "Menyimpan..." : "Simpan ke Knowledge Base"}
              </button>
            </div>
          </form>
        </section>

        {/* Saved Materials List */}
        <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <h2 className="text-sm font-semibold text-[#f0f6fc]">Daftar Materi Tersimpan</h2>
          <p className="mt-0.5 text-xs text-[#8b949e]">
            Setiap kali Generate Suggestions dijalankan, materi berstatus Active akan maju 1 chunk secara otomatis.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-xs text-[#8b949e]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#58a6ff]" />
              Memuat materi...
            </div>
          ) : materials.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#30363d] py-8 text-center text-xs text-[#8b949e]">
              Belum ada materi. Upload PDF atau catatan pertamamu di atas!
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#21262d] rounded-lg border border-[#30363d] bg-[#0d1117]">
              {materials.map((m) => (
                <div key={m.id} className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs font-semibold text-[#f0f6fc]">{m.title}</span>
                      <span className="rounded bg-[#21262d] px-1.5 py-0.5 font-mono text-[10px] text-[#8b949e]">
                        {m.sourceType}
                      </span>
                      <span className="rounded bg-[#1f6feb]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#79c0ff]">
                        Chunk {(m.currentChunkIndex % m.totalChunks) + 1} / {m.totalChunks}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#8b949e]">
                      {m.charCount.toLocaleString("id-ID")} karakter total
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetProgress(m)}
                      title="Ulangi dari Chunk 1"
                      className="rounded-lg border border-[#30363d] bg-[#161b22] p-1.5 text-[#8b949e] hover:border-[#8b949e] hover:text-[#f0f6fc]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(m)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                        m.isActive
                          ? "border-[#238636]/40 bg-[#238636]/15 text-[#3fb950]"
                          : "border-[#30363d] bg-[#161b22] text-[#8b949e]"
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      {m.isActive ? "Active" : "Paused"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      title="Hapus materi"
                      className="rounded-lg border border-[#30363d] bg-[#161b22] p-1.5 text-[#8b949e] hover:border-[#f85149]/50 hover:text-[#ff7b72]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
