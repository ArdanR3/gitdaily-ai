"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  BellRing,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Bot,
} from "lucide-react";

interface SettingsPayload {
  mode: "APPROVAL" | "AUTOPILOT";
  morningCronTime: string;
  autopilotCronTime: string;
  techPreferences: string;
  notificationChannel: "TELEGRAM" | "DISCORD" | "NONE";
}

export default function SettingsPage() {
  const [mode, setMode] = useState<"APPROVAL" | "AUTOPILOT">("APPROVAL");
  const [morningCronTime, setMorningCronTime] = useState("08:00");
  const [autopilotCronTime, setAutopilotCronTime] = useState("21:00");
  const [channel, setChannel] = useState<"TELEGRAM" | "DISCORD" | "NONE">("TELEGRAM");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = (await res.json()) as { settings: SettingsPayload };
        const s = data.settings;
        setMode(s.mode);
        setMorningCronTime(s.morningCronTime);
        setAutopilotCronTime(s.autopilotCronTime);
        setChannel(s.notificationChannel);
        try {
          setTags(JSON.parse(s.techPreferences) as string[]);
        } catch {
          setTags([]);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function addTag() {
    const clean = newTag.trim();
    if (!clean || tags.includes(clean)) return;
    setTags((prev) => [...prev, clean]);
    setNewTag("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          morningCronTime,
          autopilotCronTime,
          notificationChannel: channel,
          techPreferences: tags,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal menyimpan pengaturan." });
        return;
      }
      setAlert({ type: "success", text: "Pengaturan GitDaily AI berhasil disimpan." });
    } catch {
      setAlert({ type: "error", text: "Kesalahan jaringan saat menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestNotification() {
    setTesting(true);
    setAlert(null);
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal mengirim notifikasi test." });
        return;
      }
      setAlert({ type: "success", text: data.message || "Notifikasi uji coba berhasil dikirim!" });
    } catch {
      setAlert({ type: "error", text: "Gagal terhubung ke endpoint notifikasi." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#30363d] bg-[#161b22]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#21262d] px-2.5 py-1.5 text-xs font-medium text-[#c9d1d9] hover:border-[#8b949e]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <h1 className="text-base font-semibold text-[#f0f6fc]">Settings · GitDaily AI</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {alert && (
          <div
            className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium ${
              alert.type === "success"
                ? "border-[#238636]/50 bg-[#238636]/15 text-[#3fb950]"
                : "border-[#f85149]/50 bg-[#f85149]/15 text-[#ff7b72]"
            }`}
          >
            {alert.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{alert.text}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[#8b949e]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#58a6ff]" />
            Memuat pengaturan...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Operation Mode */}
            <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Mode Operasi</h2>
              <p className="mt-0.5 text-xs text-[#8b949e]">
                Pilih apakah bot menunggu persetujuan manual atau otomatis push jam 21:00 WIB.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("APPROVAL")}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                    mode === "APPROVAL"
                      ? "border-[#58a6ff] bg-[#1f6feb]/10"
                      : "border-[#30363d] bg-[#0d1117] hover:border-[#484f58]"
                  }`}
                >
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#58a6ff]" />
                  <div>
                    <div className="text-xs font-semibold text-[#f0f6fc]">Approval Mode (Default)</div>
                    <p className="mt-0.5 text-[11px] text-[#8b949e]">
                      Push hanya dieksekusi setelah kamu klik Approve di dashboard.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("AUTOPILOT")}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                    mode === "AUTOPILOT"
                      ? "border-[#a371f7] bg-[#a371f7]/10"
                      : "border-[#30363d] bg-[#0d1117] hover:border-[#484f58]"
                  }`}
                >
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#d2a8ff]" />
                  <div>
                    <div className="text-xs font-semibold text-[#f0f6fc]">Auto-Pilot Mode</div>
                    <p className="mt-0.5 text-[11px] text-[#8b949e]">
                      Otomatis push 1 saran aman jika belum ada aktivitas hingga {autopilotCronTime} WIB.
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* Schedule WIB */}
            <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Jadwal Harian (WIB)</h2>
              <p className="mt-0.5 text-xs text-[#8b949e]">
                Ditampilkan sebagai countdown di dashboard (eksekusi cloud mengikuti cron GitHub Actions).
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#c9d1d9]">Generate Saran Pagi (WIB)</label>
                  <input
                    type="time"
                    value={morningCronTime}
                    onChange={(e) => setMorningCronTime(e.target.value)}
                    className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 font-mono text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#c9d1d9]">Fallback Auto-Pilot (WIB)</label>
                  <input
                    type="time"
                    value={autopilotCronTime}
                    onChange={(e) => setAutopilotCronTime(e.target.value)}
                    className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 font-mono text-xs text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  />
                </div>
              </div>
            </section>

            {/* Tech Preferences */}
            <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Preferensi Tech Stack & Topik AI</h2>
              <p className="mt-0.5 text-xs text-[#8b949e]">
                Gemini akan menyesuaikan saran repo baru dan update berdasarkan tag ini.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#0d1117] px-3 py-1 text-xs text-[#c9d1d9]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-[#8b949e] hover:text-[#ff7b72]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Tambah topik (mis. Rust, Shaders, FastAPI)..."
                  className="flex-1 rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs text-[#f0f6fc] placeholder-[#6e7681] outline-none focus:border-[#58a6ff]"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-2 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah
                </button>
              </div>
            </section>

            {/* Notifications */}
            <section className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#f0f6fc]">Notifikasi Harian</h2>
                  <p className="mt-0.5 text-xs text-[#8b949e]">
                    Kirim ringkasan saran pagi & laporan status push via Telegram atau Discord.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={testing || channel === "NONE"}
                  onClick={handleTestNotification}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:border-[#58a6ff] disabled:opacity-45"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
                  Test Notification
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["TELEGRAM", "DISCORD", "NONE"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${
                      channel === ch
                        ? "border-[#58a6ff] bg-[#1f6feb]/15 text-[#79c0ff]"
                        : "border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#238636] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#2ea043] disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
