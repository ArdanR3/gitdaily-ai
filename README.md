# GitDaily AI (`@ArdanR3`)

Aplikasi web full-stack **PWA-ready** untuk membantu menjaga konsistensi kontribusi harian akun GitHub **`ArdanR3`** (`https://github.com/ArdanR3`) secara aman, bernilai, dan **100% gratis selamanya** (Neon PostgreSQL Free Tier + Vercel Hobby Plan + Gemini Free Tier + GitHub Actions Cron + Telegram/Discord).

---

## ✨ Fitur Utama

- **Maksimal 1x Aktivitas / Hari (WIB):** Guardrail database memastikan hanya ada maksimal 1 eksekusi sukses per hari (`Asia/Jakarta`).
- **AI Suggestion Engine (`gemini-2.5-flash`):** Menganalisis repo non-protected milik `ArdanR3` beserta 5 commit terakhir, lalu menghasilkan 2 saran JSON terstruktur (`CREATE_REPO` & `UPDATE_REPO`) dengan format *Conventional Commits*.
- **Repository Guard Panel:** Toggle **Allowed / Protected** per repository. Repo `ArdanR3`, `gitdaily-ai` (*self-protection*), serta proyek Unity/Blender/VR otomatis dilindungi saat sinkronisasi pertama.
- **Anti Junk & Anti Binary Commit:** Menolak konten kosong dan ekstensi biner (`.unity`, `.prefab`, `.fbx`, `.blend`, `.png`, `.tga`, dll.).
- **Dual Mode:** `APPROVAL` (default: klik Approve di dashboard) atau `AUTOPILOT` (eksekusi otomatis jam 21:00 WIB jika belum ada push hari itu).
- **Dashboard Auth Gratis:** Dilindungi `DASHBOARD_PASSWORD` + *HTTP-only cookie* HMAC-SHA256 melalui Next.js Edge Middleware.
- **PWA-Ready:** Bisa di-install di layar utama HP Android maupun iOS.

---

## 🔑 1. Cara Mengambil Kredensial Gratis (Tanpa Kartu Kredit)

### A. Neon PostgreSQL (Database Cloud Gratis)
1. Daftar di [neon.tech](https://neon.tech) menggunakan akun GitHub.
2. Buat project baru (pilih region terdekat, misal **Singapore `ap-southeast-1`**).
3. Di menu **Connection Details**:
   - Salin **Pooled connection string** → isi ke `DATABASE_URL`.
   - Matikan toggle *Connection pooling* lalu salin **Direct connection string** → isi ke `DIRECT_URL`.

### B. GitHub Personal Access Token (`ArdanR3`)
1. Buka **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**.
2. Klik **Generate new token (classic)**, beri nama `gitdaily-ai`.
3. Centang scope **`repo`** (akses penuh public & private repo) dan **`read:user`**.
4. Salin token (`ghp_...`) → isi ke `GITHUB_TOKEN`.

### C. Google Gemini API Key (Free Tier)
1. Buka [Google AI Studio](https://aistudio.google.com/apikey).
2. Klik **Create API key** → salin hasilnya ke `GEMINI_API_KEY`.
3. Biarkan `GEMINI_MODEL="gemini-2.5-flash"`.

### D. Telegram Bot (Notifikasi Gratis)
1. Chat ke **`@BotFather`** di Telegram → kirim `/newbot` → ikuti instruksi sampai mendapat **Bot Token** → isi ke `TELEGRAM_BOT_TOKEN`.
2. Kirim 1 pesan bebas (misal `"halo"`) ke bot baru kamu.
3. Buka di browser: `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates`
4. Cari nilai `"chat":{"id": 123456789}` → salin angkanya ke `TELEGRAM_CHAT_ID`.
   *(Opsional: jika lebih suka Discord, cukup isi `DISCORD_WEBHOOK_URL` dan ubah channel ke `DISCORD` di halaman Settings.)*

---

## 💻 2. Menjalankan di Lokal

1. Salin `.env.example` menjadi `.env.local` dan lengkapi nilainya (termasuk `DASHBOARD_PASSWORD` dan `CRON_SECRET` acak):
   ```bash
   cp .env.example .env.local
   ```
2. Install dependensi dan push skema Prisma ke Neon PostgreSQL:
   ```bash
   npm install
   npx prisma db push
   ```
3. Jalankan server development:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000`, login dengan `DASHBOARD_PASSWORD`, lalu klik **Sync Repos** → **Generate Suggestions**.

---

## 🚀 3. Deploy 100% Gratis ke Vercel Hobby Plan + GitHub Actions

### A. Push ke GitHub & Deploy ke Vercel
1. Buat repository baru bernama **`gitdaily-ai`** (disarankan **Private** atau **Public**) di akun `ArdanR3`, lalu push proyek ini ke GitHub.
2. Buka [vercel.com](https://vercel.com), login dengan GitHub, klik **Add New → Project**, pilih repo `gitdaily-ai`.
3. Di menu **Environment Variables**, masukkan seluruh variabel dari `.env.local`:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `GITHUB_USERNAME` = `ArdanR3`
   - `GITHUB_TOKEN`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` *(atau `DISCORD_WEBHOOK_URL`)*
   - `DASHBOARD_PASSWORD`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL` = URL Vercel kamu (misal `https://gitdaily-ai.vercel.app`)
   - `TZ` = `Asia/Jakarta`
4. Klik **Deploy**. Setelah sukses, jalankan `npx prisma db push` sekali jika tabel belum dibuat di Neon.

### B. Aktifkan Jadwal Harian via GitHub Actions (Gratis)
Workflow sudah tersedia di `.github/workflows/gitdaily-cron.yml`:
- **08:00 WIB (`01:00 UTC`)** → memanggil `POST /api/cron/daily` (sync repo, generate 2 saran, kirim notifikasi).
- **21:00 WIB (`14:00 UTC`)** → memanggil `POST /api/cron/autopilot` (auto-push hanya jika mode `AUTOPILOT` & belum ada push sukses hari itu).

Agar workflow bisa berjalan:
1. Buka repo `gitdaily-ai` di GitHub → **Settings → Secrets and variables → Actions**.
2. Klik **New repository secret** dan tambahkan 2 secret berikut:
   - `APP_URL`: URL production Vercel kamu **tanpa garis miring di akhir**, contoh `https://gitdaily-ai.vercel.app`
   - `CRON_SECRET`: nilai secret yang sama persis dengan `CRON_SECRET` di Vercel.
3. Kamu bisa langsung mengetesnya di tab **Actions → GitDaily AI Scheduler → Run workflow**.

---

## 📱 4. Cara Install sebagai Aplikasi HP (PWA)

- **Android (Chrome):**
  1. Buka URL Vercel kamu di Chrome dan login.
  2. Ketuk ikon titik tiga (`⋮`) di pojok kanan atas → pilih **Install app** / **Tambahkan ke layar utama**.
- **iOS (Safari):**
  1. Buka URL Vercel kamu di Safari dan login.
  2. Ketuk tombol **Share** (ikon kotak dengan panah ke atas) → pilih **Add to Home Screen** → **Add**.
