import { describe, expect, it } from "vitest";
import { detectDefaultProtection, validateFilesForCommit } from "@/lib/dailyGuard";

describe("validateFilesForCommit", () => {
  it("accepts clean text and code files and normalizes paths", () => {
    const result = validateFilesForCommit([
      { path: "/src\\utils\\math.ts", content: "export const add = (a: number, b: number) => a + b;\n" },
      { path: "README.md", content: "# Demo\n" },
    ]);

    expect(result).toEqual([
      { path: "src/utils/math.ts", content: "export const add = (a: number, b: number) => a + b;\n" },
      { path: "README.md", content: "# Demo\n" },
    ]);
  });

  it("rejects empty file lists and empty file contents (anti-junk)", () => {
    expect(() => validateFilesForCommit([])).toThrow(/tidak boleh kosong/i);
    expect(() => validateFilesForCommit([{ path: "notes.md", content: "   \n\t  " }])).toThrow(/kosong/i);
  });

  it("rejects path traversal, .git, .github workflows, .vscode, and .env files", () => {
    const forbiddenPaths = [
      "../secret.txt",
      "src/../../etc/passwd",
      ".git/config",
      ".github/workflows/pwn.yml",
      ".husky/pre-commit",
      ".vscode/tasks.json",
      ".env",
      ".env.local",
      "nested/.env.production",
    ];

    for (const badPath of forbiddenPaths) {
      expect(() => validateFilesForCommit([{ path: badPath, content: "x" }])).toThrow(/berisiko|tidak valid/i);
    }
  });

  it("rejects sensitive config manifests and binary asset extensions", () => {
    const blockedFiles = [
      "package.json",
      "package-lock.json",
      "Dockerfile",
      "vercel.json",
      "next.config.ts",
      "pyproject.toml",
      "requirements.txt",
      "assets/scene.unity",
      "models/hero.fbx",
      "models/rig.blend",
      "textures/albedo.png",
    ];

    for (const badPath of blockedFiles) {
      expect(() => validateFilesForCommit([{ path: badPath, content: "data" }])).toThrow(/dilarang/i);
    }
  });

  it("enforces max 5 files per commit and max 50 KB per file", () => {
    const sixFiles = Array.from({ length: 6 }, (_, i) => ({
      path: `src/file-${i}.ts`,
      content: `export const n = ${i};\n`,
    }));
    expect(() => validateFilesForCommit(sixFiles)).toThrow(/Maksimal 5 file/i);

    const oversized = "a".repeat(50 * 1024 + 1);
    expect(() => validateFilesForCommit([{ path: "src/huge.txt", content: oversized }])).toThrow(/50 KB/i);
  });
});

describe("detectDefaultProtection", () => {
  it("always protects private repositories permanently", () => {
    const res = detectDefaultProtection("random-public-name", null, "TypeScript", true);
    expect(res.isProtected).toBe(true);
    expect(res.reason).toMatch(/Private/i);
  });

  it("auto-protects gitdaily-ai, profile repo, and Unity/Blender projects", () => {
    expect(detectDefaultProtection("gitdaily-ai", null, "TypeScript", false).isProtected).toBe(true);
    expect(detectDefaultProtection("blender-unity-pipeline", null, "Python", false).isProtected).toBe(true);
    expect(detectDefaultProtection("nextjs-threejs-starter", "WebGL demo", "TypeScript", false).isProtected).toBe(false);
  });
});
