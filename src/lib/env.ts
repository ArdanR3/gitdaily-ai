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

const DEFAULT_TIMEZONE = "Asia/Jakarta";

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function getTimezone(): string {
  const explicit = process.env.APP_TIMEZONE?.trim().replace(/^["']|["']$/g, "");
  if (explicit && isValidTimeZone(explicit)) {
    return explicit;
  }

  // Vercel / AWS Lambda sets process.env.TZ=":UTC" by default, which throws
  // RangeError in Intl.DateTimeFormat and overrides WIB if accepted blindly.
  const rawTz = process.env.TZ?.trim().replace(/^["']|["']$/g, "");
  if (!rawTz || rawTz.startsWith(":") || rawTz.toUpperCase() === "UTC" || rawTz.toUpperCase() === "ETC/UTC") {
    return DEFAULT_TIMEZONE;
  }

  return isValidTimeZone(rawTz) ? rawTz : DEFAULT_TIMEZONE;
}

export function getCronSecret(): string {
  return process.env.CRON_SECRET?.trim() || "";
}

export function getDashboardPassword(): string {
  return process.env.DASHBOARD_PASSWORD?.trim() || "";
}
