import { prisma } from "./prisma";
import { getTodayWibKey } from "./time";
import type { GeneratedFile } from "@/types";

const BLOCKED_BINARY_EXTENSIONS = new Set([
  ".unity",
  ".prefab",
  ".asset",
  ".mat",
  ".fbx",
  ".blend",
  ".blend1",
  ".blend2",
  ".obj",
  ".glb",
  ".gltf",
  ".png",
  ".jpg",
  ".jpeg",
  ".tga",
  ".gif",
  ".webp",
  ".psd",
  ".exr",
  ".mp3",
  ".wav",
  ".ogg",
  ".mp4",
  ".mov",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".exe",
  ".dll",
  ".so",
  ".apk",
  ".aab",
  ".pdf",
  ".bin",
  ".sqlite",
  ".db",
]);

export function validateFilesForCommit(files: GeneratedFile[]): GeneratedFile[] {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Daftar file untuk commit tidak boleh kosong.");
  }

  return files.map((file) => {
    const cleanPath = file.path.trim().replace(/^\/+/, "").replace(/\\/g, "/");
    if (!cleanPath || cleanPath.includes("..") || cleanPath.startsWith(".git/")) {
      throw new Error(`Path file tidak valid: "${file.path}"`);
    }

    const dotIdx = cleanPath.lastIndexOf(".");
    if (dotIdx !== -1) {
      const ext = cleanPath.slice(dotIdx).toLowerCase();
      if (BLOCKED_BINARY_EXTENSIONS.has(ext)) {
        throw new Error(`File biner/non-teks dilarang di-commit oleh AI: "${cleanPath}"`);
      }
    }

    if (typeof file.content !== "string" || file.content.trim().length === 0) {
      throw new Error(`Konten file "${cleanPath}" kosong (junk commit ditolak).`);
    }

    return { path: cleanPath, content: file.content };
  });
}

export async function hasExecutedToday(dateKey: string = getTodayWibKey()): Promise<boolean> {
  const existing = await prisma.activityLog.findFirst({
    where: { dateKey, status: "SUCCESS" },
    select: { id: true },
  });
  return Boolean(existing);
}

export function detectDefaultProtection(
  name: string,
  description: string | null,
  language: string | null,
  isPrivate: boolean = false
): { isProtected: boolean; reason: string | null } {
  if (isPrivate) {
    return {
      isProtected: true,
      reason: "Private repository (dilindungi otomatis)",
    };
  }

  const text = `${name} ${description ?? ""}`.toLowerCase();
  if (
    name.toLowerCase() === (process.env.GITHUB_USERNAME || "ArdanR3").toLowerCase() ||
    name.toLowerCase() === "gitdaily-ai" ||
    text.includes("unity") ||
    text.includes("blender") ||
    text.includes("k3") ||
    text.includes("vr") ||
    language?.toLowerCase() === "shaderlab"
  ) {
    const isSelf = name.toLowerCase() === "gitdaily-ai";
    return {
      isProtected: true,
      reason: isSelf
        ? "Auto-protected: repository kode sumber GitDaily AI sendiri"
        : "Auto-protected: profil utama atau proyek Unity/Blender/aset biner",
    };
  }
  return { isProtected: false, reason: null };
}
