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
  Sliders,
  GitBranch,
  GitPullRequest,
} from "lucide-react";

interface SettingsPayload {
  mode: "APPROVAL" | "AUTOPILOT";
  pushMode?: "DIRECT_MAIN" | "BRANCH_PR";
  morningCronTime: string;
  autopilotCronTime: string;
  techPreferences: string;
  notificationChannel: "TELEGRAM" | "DISCORD" | "NONE";
}

export default function SettingsPage() {
  const [mode, setMode] = useState<"APPROVAL" | "AUTOPILOT">("APPROVAL");
  const [pushMode, setPushMode] = useState<"DIRECT_MAIN" | "BRANCH_PR">("DIRECT_MAIN");
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
        setPushMode(s.pushMode === "BRANCH_PR" ? "BRANCH_PR" : "DIRECT_MAIN");
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
          pushMode,
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
    <div className="nb-grid-bg min-h-screen">
      {/* Bold Neubrutalist Blue Header */}
      <header className="border-b-4 border-black bg-[#74B9FF] text-black">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-white px-4 py-1.5 text-xs font-extrabold uppercase text-black sm:min-h-[38px]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
            <span className="border-2 border-black bg-black px-3 py-1 font-mono text-[11px] font-extrabold text-[#FFD23F]">
              MODE: {mode}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center border-3 border-black bg-[#FFD23F] text-black shadow-[4px_4px_0_0_#000]">
              <Sliders className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-black sm:text-3xl">
                Settings · Control Panel
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-black/80 sm:text-sm">
                Atur mode operasi, jadwal WIB, preferensi tech stack AI, dan notifikasi Telegram/Discord.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {alert && (
          <div
            role="status"
            className={`mb-5 flex items-center gap-2.5 border-3 border-black px-4 py-3 text-xs font-extrabold text-black shadow-[5px_5px_0_0_#000] ${
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

        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs font-bold text-black">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memuat pengaturan...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Operation Mode */}
            <section className="nb-card p-5 sm:p-6">
              <h2 className="font-display text-base font-extrabold uppercase text-black">Mode Operasi</h2>
              <p className="mt-0.5 text-xs font-medium text-black/75">
                Pilih apakah bot menunggu persetujuan manual atau otomatis push pada jam Auto-Pilot WIB.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("APPROVAL")}
                  className={`flex cursor-pointer items-start gap-3 border-3 border-black p-4 text-left shadow-[4px_4px_0_0_#000] transition ${
                    mode === "APPROVAL" ? "bg-[#74B9FF]" : "bg-[#FFFDF5] hover:bg-[#FFF3C4]"
                  }`}
                >
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-extrabold uppercase text-black">
                      Approval Mode (Default)
                    </div>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-black/80">
                      Push hanya dieksekusi setelah kamu klik Approve &amp; Push di dashboard.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("AUTOPILOT")}
                  className={`flex cursor-pointer items-start gap-3 border-3 border-black p-4 text-left shadow-[4px_4px_0_0_#000] transition ${
                    mode === "AUTOPILOT" ? "bg-[#B8A9FA]" : "bg-[#FFFDF5] hover:bg-[#FFF3C4]"
                  }`}
                >
                  <Bot className="mt-0.5 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-extrabold uppercase text-black">Auto-Pilot Mode</div>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-black/80">
                      Otomatis push 1 saran aman jika belum ada aktivitas hingga {autopilotCronTime} WIB.
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* Execution Delivery Mode (Direct Main vs Branch + PR) */}
            <section className="nb-card p-5 sm:p-6">
              <h2 className="font-display text-base font-extrabold uppercase text-black">
                Mode Eksekusi Update Repo
              </h2>
              <p className="mt-0.5 text-xs font-medium text-black/75">
                Tentukan apakah update repo lama langsung di-push ke branch default atau lewat branch baru + Pull Request.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={pushMode === "DIRECT_MAIN"}
                  onClick={() => setPushMode("DIRECT_MAIN")}
                  className={`flex min-h-[44px] cursor-pointer items-start gap-3 border-3 border-black p-4 text-left shadow-[4px_4px_0_0_#000] transition ${
                    pushMode === "DIRECT_MAIN" ? "bg-[#88D498]" : "bg-[#FFFDF5] hover:bg-[#FFF3C4]"
                  }`}
                >
                  <GitBranch className="mt-0.5 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-extrabold uppercase text-black">
                      Direct Main (Default)
                    </div>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-black/80">
                      Commit langsung ke branch default (main/master) agar kontribusi harian langsung tercatat.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  aria-pressed={pushMode === "BRANCH_PR"}
                  onClick={() => setPushMode("BRANCH_PR")}
                  className={`flex min-h-[44px] cursor-pointer items-start gap-3 border-3 border-black p-4 text-left shadow-[4px_4px_0_0_#000] transition ${
                    pushMode === "BRANCH_PR" ? "bg-[#FFD23F]" : "bg-[#FFFDF5] hover:bg-[#FFF3C4]"
                  }`}
                >
                  <GitPullRequest className="mt-0.5 h-5 w-5 shrink-0 text-black" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-extrabold uppercase text-black">
                      Branch + Pull Request
                    </div>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-black/80">
                      Buat branch gitdaily/ai-YYYYMMDD-... dan buka Pull Request untuk direview di GitHub.
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* Schedule WIB */}
            <section className="nb-card p-5 sm:p-6">
              <h2 className="font-display text-base font-extrabold uppercase text-black">
                Jadwal Harian (WIB)
              </h2>
              <p className="mt-0.5 text-xs font-medium text-black/75">
                Ditampilkan sebagai countdown di header dashboard (cron cloud via GitHub Actions).
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="morning-time" className="mb-1.5 block text-xs font-extrabold uppercase text-black">
                    Generate Saran Pagi (WIB)
                  </label>
                  <input
                    id="morning-time"
                    type="time"
                    value={morningCronTime}
                    onChange={(e) => setMorningCronTime(e.target.value)}
                    className="nb-input w-full px-3.5 py-2.5 font-mono text-base font-bold sm:text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="autopilot-time" className="mb-1.5 block text-xs font-extrabold uppercase text-black">
                    Fallback Auto-Pilot (WIB)
                  </label>
                  <input
                    id="autopilot-time"
                    type="time"
                    value={autopilotCronTime}
                    onChange={(e) => setAutopilotCronTime(e.target.value)}
                    className="nb-input w-full px-3.5 py-2.5 font-mono text-base font-bold sm:text-xs"
                  />
                </div>
              </div>
            </section>

            {/* Tech Preferences */}
            <section className="nb-card p-5 sm:p-6">
              <h2 className="font-display text-base font-extrabold uppercase text-black">
                Preferensi Tech Stack &amp; Topik AI
              </h2>
              <p className="mt-0.5 text-xs font-medium text-black/75">
                AI akan menyesuaikan saran repo baru dan update berdasarkan tag minat ini.
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 border-2 border-black bg-[#FFD23F] px-3 py-1 font-mono text-xs font-extrabold text-black shadow-[2px_2px_0_0_#000]"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={`Hapus tag ${tag}`}
                      onClick={() => removeTag(tag)}
                      className="cursor-pointer border border-black bg-white p-0.5 text-black hover:bg-[#FF6B6B]"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="mt-4 flex gap-2.5">
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
                  className="nb-input min-w-0 flex-1 px-4 py-2 text-base font-bold placeholder-black/65 sm:text-xs"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="nb-btn-sm inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 bg-[#B8A9FA] px-4 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[38px]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tambah</span>
                </button>
              </div>
            </section>

            {/* Notifications */}
            <section className="nb-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-extrabold uppercase text-black">
                    Notifikasi Harian
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-black/75">
                    Kirim ringkasan saran pagi &amp; laporan status push via Telegram atau Discord.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={testing || channel === "NONE"}
                  onClick={handleTestNotification}
                  className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#FFD23F] px-3.5 py-1.5 text-xs font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-[38px]"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
                  <span>Test Notification</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {(["TELEGRAM", "DISCORD", "NONE"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`nb-btn-sm min-h-[44px] cursor-pointer py-2.5 font-mono text-xs font-extrabold uppercase text-black sm:min-h-[38px] ${
                      channel === ch ? "bg-black text-[#FFD23F]" : "bg-[#FFFDF5] hover:bg-[#FFF3C4]"
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
                className="nb-btn inline-flex min-h-[44px] cursor-pointer items-center gap-2 bg-[#88D498] px-6 py-2.5 text-xs font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
