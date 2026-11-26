export function getGitHubUsername(): string {
  return process.env.GITHUB_USERNAME?.trim() || "ArdanR3";
}

export function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error("GITHUB_TOKEN belum dikonfigurasi di .env.local");
  }
  return token;
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di .env.local");
  }
  return key;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}

export function getTimezone(): string {
  return process.env.TZ?.trim() || "Asia/Jakarta";
}

export function getCronSecret(): string {
  return process.env.CRON_SECRET?.trim() || "";
}

export function getDashboardPassword(): string {
  return process.env.DASHBOARD_PASSWORD?.trim() || "";
}
