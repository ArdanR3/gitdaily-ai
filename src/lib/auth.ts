export const SESSION_COOKIE_NAME = "gitdaily_session";

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(password: string): Promise<string> {
  const secret = process.env.CRON_SECRET?.trim() || password;
  return hmacHex(`gitdaily-auth:${password}`, secret);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD?.trim();
  if (!password) return true; // If no password set in dev, allow access
  if (!token) return false;
  const expected = await createSessionToken(password);
  return token === expected;
}

export function verifyCronAuthorization(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  return authHeader.slice(7).trim() === secret;
}
