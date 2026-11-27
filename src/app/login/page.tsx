"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, Terminal } from "lucide-react";

function sanitizeNextPath(raw: string | null): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return "/";
  }
  return trimmed;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Password salah.");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nb-grid-bg flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md border-4 border-black bg-white shadow-[10px_10px_0_0_#000]">
        <div className="border-b-4 border-black bg-[#FFD23F] px-6 py-7 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border-3 border-black bg-black text-[#FFD23F] shadow-[4px_4px_0_0_#FFF]">
            <Terminal className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-black">
            GitDaily AI
          </h1>
          <span className="mt-2 inline-block border-2 border-black bg-white px-3 py-0.5 font-mono text-xs font-extrabold text-black">
            PRIVATE CONSOLE · @ArdanR3
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-extrabold uppercase text-black">
              Dashboard Password / PIN
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
                aria-hidden="true"
              />
              <input
                id="password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="nb-input w-full py-3 pl-10 pr-3.5 text-base font-bold placeholder-black/65 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="border-2 border-black bg-[#FF6B6B] px-3.5 py-2.5 text-xs font-extrabold text-black shadow-[3px_3px_0_0_#000]"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="nb-btn flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 bg-[#88D498] px-5 py-2.5 text-sm font-extrabold uppercase text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="nb-grid-bg min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
