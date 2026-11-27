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

const BLOCKED_FILENAMES = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  ".npmrc",
  ".yarnrc",
  ".yarnrc.yml",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".gitlab-ci.yml",
  "makefile",
  "vercel.json",
  "pyproject.toml",
  "setup.py",
  "requirements.txt",
  ".gitmodules",
]);

const MAX_FILES_PER_COMMIT = 5;
const MAX_FILE_BYTES = 50 * 1024;

export function validateFilesForCommit(files: GeneratedFile[]): GeneratedFile[] {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Daftar file untuk commit tidak boleh kosong.");
  }
  if (files.length > MAX_FILES_PER_COMMIT) {
    throw new Error(`Maksimal ${MAX_FILES_PER_COMMIT} file per commit diperbolehkan.`);
  }

  return files.map((file) => {
    const cleanPath = file.path.trim().replace(/\\/g, "/").replace(/^\/+/, "");
    const segments = cleanPath.split("/");
    const lowerPath = cleanPath.toLowerCase();
    const baseName = (segments[segments.length - 1] || "").toLowerCase();

    if (
      !cleanPath ||
      segments.some((seg) => !seg || seg === "." || seg === ".." || seg.toLowerCase() === ".git") ||
      lowerPath.startsWith(".github/") ||
      lowerPath.startsWith(".husky/") ||
      lowerPath.startsWith(".vscode/") ||
      baseName.startsWith(".env") ||
      baseName.startsWith("next.config.") ||
      BLOCKED_FILENAMES.has(baseName)
    ) {
      throw new Error(`Path file berisiko atau tidak valid dilarang di-commit oleh AI: "${file.path}"`);
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

    if (Buffer.byteLength(file.content, "utf-8") > MAX_FILE_BYTES) {
      throw new Error(`Ukuran file "${cleanPath}" melebihi batas maksimum 50 KB.`);
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
