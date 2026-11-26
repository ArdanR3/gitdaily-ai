export const SESSION_COOKIE_NAME = "gitdaily_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

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

function getSigningSecret(password: string): string {
  const cronSecret = process.env.CRON_SECRET?.trim();
  return cronSecret ? `${cronSecret}:${password}` : `gitdaily-session-key:${password}`;
}

export async function createSessionToken(password: string): Promise<string> {
  const exp = Date.now() + SESSION_TTL_MS;
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const payload = `${exp}.${nonce}`;
  const sig = await hmacHex(`gitdaily-auth:${payload}`, getSigningSecret(password));
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD?.trim();
  // Fail closed when DASHBOARD_PASSWORD is unset or empty
  if (!password || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [expStr, nonce, sig] = parts;
  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp <= Date.now() || !nonce || !sig) {
    return false;
  }

  const expectedSig = await hmacHex(`gitdaily-auth:${expStr}.${nonce}`, getSigningSecret(password));
  return constantTimeEqual(sig, expectedSig);
}

export function verifyDashboardPassword(candidate: string | undefined): boolean {
  const expected = process.env.DASHBOARD_PASSWORD?.trim();
  if (!expected || !candidate) return false;
  return constantTimeEqual(candidate, expected);
}

export function verifyCronAuthorization(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || !authHeader || !authHeader.startsWith("Bearer ")) return false;
  return constantTimeEqual(authHeader.slice(7).trim(), secret);
}
