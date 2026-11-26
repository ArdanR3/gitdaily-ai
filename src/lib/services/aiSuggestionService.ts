import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey, getGeminiModel, getGitHubUsername } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { validateFilesForCommit } from "@/lib/dailyGuard";
import { getTodayWibKey } from "@/lib/time";
import type { AISuggestionDraft, CommitSummary } from "@/types";

const SUGGESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["CREATE_REPO", "UPDATE_REPO"] },
          target_repo: { type: Type.STRING },
          visibility: { type: Type.STRING, enum: ["public", "private"] },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["path", "content"],
            },
          },
        },
        required: ["type", "target_repo", "visibility", "title", "reasoning", "files"],
      },
    },
  },
  required: ["suggestions"],
};

async function callGroqJson(prompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) {
    throw new Error("GROQ_API_KEY belum diatur.");
  }

  const model = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'You are a senior software engineer. Always respond ONLY with valid JSON matching {"suggestions": [{"type": "CREATE_REPO" | "UPDATE_REPO", "target_repo": string, "visibility": "public" | "private", "title": string, "description": string, "reasoning": string, "files": [{"path": string, "content": string}]}]}.',
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq API mengembalikan respons kosong.");
  }
  return text;
}

export async function generateDailySuggestions(dateKey: string = getTodayWibKey()) {
  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Only include non-protected repositories (token-optimized: max 12 repos)
  const allowedRepos = await prisma.repository.findMany({
    where: { isProtected: false },
    orderBy: { lastSyncedAt: "desc" },
    take: 12,
  });

  const compactContext = allowedRepos.map((r) => {
    let commits: CommitSummary[] = [];
    try {
      commits = JSON.parse(r.recentCommits || "[]") as CommitSummary[];
    } catch {
      commits = [];
    }
    return {
      name: r.name,
      lang: r.language || "Unknown",
      desc: (r.description || "").slice(0, 100),
      commits: commits.slice(0, 3).map((c) => c.message.slice(0, 70)),
    };
  });

  const hasAllowedRepos = compactContext.length > 0;
  const username = getGitHubUsername();

  const prompt = `Kamu adalah asisten engineering untuk akun GitHub "${username}".
Preferensi tech stack & domain: ${settings.techPreferences}.

Daftar repository milik ${username} yang BOLEH di-update (ringkas):
${JSON.stringify(compactContext)}

Tugasmu: Hasilkan tepat 2 saran bernilai tinggi dalam JSON:
1. Satu saran dengan type "CREATE_REPO": ide micro-project / utility / template baru yang relevan dengan preferensi di atas, dengan nama repo kebab-case yang belum ada di daftar, deskripsi singkat, dan 2-3 file awal berkualitas (termasuk README.md + kode fungsional).
2. ${
    hasAllowedRepos
      ? 'Satu saran dengan type "UPDATE_REPO": peningkatan nyata (dokumentasi, unit test, helper script, atau refactoring aman) pada SALAH SATU repo dari daftar di atas. Gunakan nama repo persis dari daftar.'
      : 'Karena belum ada repo lama yang berstatus Allowed, buat saran kedua juga bertipe "CREATE_REPO" di domain berbeda.'
  }

Aturan WAJIB:
- Gunakan format Conventional Commits pada field "title" (contoh: "feat: ...", "docs: ...", "test: ...", "refactor: ...").
- DILARANG membuat junk commit, file kosong, placeholder komentar saja, atau menyentuh file biner (.unity, .fbx, .blend, .png, .tga, dll).
- Semua file harus berupa kode teks atau Markdown yang lengkap, bersih, dan langsung siap commit.
- Tulis "reasoning" singkat dalam Bahasa Indonesia mengapa ini bagus untuk portofolio ${username}.`;

  let rawText: string | undefined;

  if (process.env.GROQ_API_KEY?.trim()) {
    rawText = await callGroqJson(prompt);
  } else {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SUGGESTION_SCHEMA,
        temperature: 0.7,
      },
    });
    rawText = response.text;
  }

  if (!rawText) {
    throw new Error("AI Engine mengembalikan respons kosong.");
  }

  const parsed = JSON.parse(rawText) as { suggestions: AISuggestionDraft[] };
  if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
    throw new Error("Format JSON saran dari Gemini tidak valid.");
  }

  // Mark old PENDING suggestions for today as SKIPPED before saving regenerated ones
  await prisma.dailySuggestion.updateMany({
    where: { dateKey, status: "PENDING" },
    data: { status: "SKIPPED" },
  });

  const allowedNames = new Set(allowedRepos.map((r) => r.name));
  const saved = [];

  for (const item of parsed.suggestions.slice(0, 2)) {
    const cleanFiles = validateFilesForCommit(item.files);

    // Extra safety: if AI picked an UPDATE_REPO not in allowedRepos, reject or convert
    if (item.type === "UPDATE_REPO" && !allowedNames.has(item.target_repo)) {
      throw new Error(`AI menyarankan repo tidak diizinkan/protected: ${item.target_repo}`);
    }

    const record = await prisma.dailySuggestion.create({
      data: {
        dateKey,
        type: item.type,
        targetRepo: item.target_repo.trim(),
        visibility: item.visibility === "private" ? "private" : "public",
        title: item.title.trim(),
        description: item.description?.trim() || null,
        reasoning: item.reasoning.trim(),
        filesJson: JSON.stringify(cleanFiles),
        status: "PENDING",
      },
    });
    saved.push(record);
  }

  return saved;
}
