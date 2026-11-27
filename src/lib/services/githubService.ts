import { Octokit } from "@octokit/rest";
import { getGitHubToken, getGitHubUsername } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { detectDefaultProtection, validateFilesForCommit } from "@/lib/dailyGuard";
import type { CommitSummary, GeneratedFile, GitHubProfileSummary, PushResult } from "@/types";

function getOctokit(): Octokit {
  return new Octokit({ auth: getGitHubToken() });
}

export function formatGitHubError(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const err = error as { status?: number; message?: string; response?: { headers?: Record<string, string> } };
    if (err.status === 401) {
      return "GitHub Token tidak valid atau sudah kedaluwarsa (401 Unauthorized).";
    }
    if (err.status === 403 || err.status === 429) {
      const reset = err.response?.headers?.["x-ratelimit-reset"];
      const resetInfo = reset ? ` Reset pada ${new Date(Number(reset) * 1000).toLocaleTimeString("id-ID")}.` : "";
      return `GitHub API terkena rate-limit atau izin token kurang (403/429).${resetInfo}`;
    }
    if (err.status === 404) {
      return `Resource atau branch GitHub tidak ditemukan (404): ${err.message ?? ""}`;
    }
    if (err.status === 422) {
      return `Validasi GitHub gagal (422) — kemungkinan nama repository sudah dipakai: ${err.message ?? ""}`;
    }
    return `GitHub API error (${err.status}): ${err.message ?? "Unknown error"}`;
  }
  return error instanceof Error ? error.message : String(error);
}

export async function fetchGitHubProfile(): Promise<GitHubProfileSummary> {
  const octokit = getOctokit();
  const username = getGitHubUsername();
  try {
    const { data } = await octokit.users.getAuthenticated();
    return {
      username: data.login || username,
      name: data.name || username,
      avatarUrl: data.avatar_url,
      profileUrl: data.html_url || `https://github.com/${username}`,
      bio: data.bio ?? null,
      publicRepos: data.public_repos,
      totalPrivateRepos: data.total_private_repos ?? 0,
    };
  } catch (error) {
    throw new Error(formatGitHubError(error));
  }
}

export async function syncRepositoriesFromGitHub() {
  const octokit = getOctokit();
  const owner = getGitHubUsername();

  try {
    const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
      affiliation: "owner",
      sort: "updated",
      direction: "desc",
      per_page: 100,
    });

    const ownerRepos = repos.filter((repo) => repo.owner.login.toLowerCase() === owner.toLowerCase());
    const liveGithubIds = ownerRepos.map((repo) => repo.id);

    // Prune stale repositories that were deleted/transferred on GitHub
    await prisma.repository.deleteMany({
      where: liveGithubIds.length > 0 ? { githubId: { notIn: liveGithubIds } } : {},
    });

    for (let i = 0; i < ownerRepos.length; i++) {
      const repo = ownerRepos[i];

      // Fetch last 5 commits only for the top 15 most recently updated repos to conserve API quota
      let recentCommits: CommitSummary[] = [];
      if (i < 15) {
        try {
          const { data: commits } = await octokit.repos.listCommits({
            owner,
            repo: repo.name,
            per_page: 5,
          });
          recentCommits = commits.map((c) => ({
            sha: c.sha.slice(0, 7),
            message: (c.commit.message || "").split("\n")[0].slice(0, 100),
            date: c.commit.author?.date || "",
          }));
        } catch {
          // Empty repo or no commits yet
          recentCommits = [];
        }
      }

      const existing = await prisma.repository.findUnique({
        where: { githubId: repo.id },
      });

      const autoProtect = detectDefaultProtection(
        repo.name,
        repo.description ?? null,
        repo.language ?? null,
        repo.private
      );

      await prisma.repository.upsert({
        where: { githubId: repo.id },
        update: {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          defaultBranch: repo.default_branch || "main",
          isPrivate: repo.private,
          ...(repo.private
            ? {
                isProtected: true,
                protectionReason: "Private repository (dilindungi otomatis)",
              }
            : {}),
          recentCommits: recentCommits.length > 0 ? JSON.stringify(recentCommits) : existing?.recentCommits ?? "[]",
          lastSyncedAt: new Date(),
        },
        create: {
          githubId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          defaultBranch: repo.default_branch || "main",
          isPrivate: repo.private,
          isProtected: autoProtect.isProtected,
          protectionReason: autoProtect.reason,
          recentCommits: JSON.stringify(recentCommits),
          lastSyncedAt: new Date(),
        },
      });
    }

    return await prisma.repository.findMany({
      orderBy: [{ isProtected: "asc" }, { lastSyncedAt: "desc" }],
    });
  } catch (error) {
    throw new Error(formatGitHubError(error));
  }
}

async function resolveBranchRef(octokit: Octokit, owner: string, repo: string, preferredBranch: string) {
  const candidates = Array.from(new Set([preferredBranch, "main", "master"]));
  for (const branch of candidates) {
    try {
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      return { branch, headSha: ref.object.sha };
    } catch {
      // Try next branch candidate
    }
  }
  throw new Error(`Tidak dapat menemukan branch aktif (${candidates.join("/")}) di repo ${owner}/${repo}.`);
}

export async function pushFilesToExistingRepo(
  repo: string,
  preferredBranch: string,
  commitMessage: string,
  files: GeneratedFile[]
): Promise<PushResult> {
  const validatedFiles = validateFilesForCommit(files);
  const octokit = getOctokit();
  const owner = getGitHubUsername();

  try {
    // Live privacy check before touching any existing repository
    const { data: liveRepo } = await octokit.repos.get({ owner, repo });
    if (liveRepo.private) {
      throw new Error(
        `Diblokir oleh Security Guard: repository "${repo}" saat ini berstatus Private di GitHub.`
      );
    }

    const { branch, headSha } = await resolveBranchRef(octokit, owner, repo, preferredBranch);

    const { data: baseCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: headSha,
    });

    const treeItems = await Promise.all(
      validatedFiles.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content, "utf-8").toString("base64"),
          encoding: "base64",
        });
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      })
    );

    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: treeItems,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [headSha],
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return {
      repo,
      branch,
      commitSha: newCommit.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
    };
  } catch (error) {
    throw new Error(formatGitHubError(error));
  }
}

function buildAiBranchSlug(commitMessage: string): string {
  const cleaned = commitMessage
    .toLowerCase()
    .replace(/^[a-z]+(\([^)]*\))?:\s*/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return cleaned || "update";
}

export async function pushFilesViaBranchAndPR(
  repo: string,
  preferredBranch: string,
  dateKey: string,
  commitMessage: string,
  reasoning: string,
  files: GeneratedFile[]
): Promise<PushResult> {
  const validatedFiles = validateFilesForCommit(files);
  const octokit = getOctokit();
  const owner = getGitHubUsername();

  try {
    // Live privacy check before touching any existing repository
    const { data: liveRepo } = await octokit.repos.get({ owner, repo });
    if (liveRepo.private) {
      throw new Error(
        `Diblokir oleh Security Guard: repository "${repo}" saat ini berstatus Private di GitHub.`
      );
    }

    const { branch: baseBranch, headSha } = await resolveBranchRef(octokit, owner, repo, preferredBranch);

    const compactDate = dateKey.replace(/-/g, "");
    const baseSlug = buildAiBranchSlug(commitMessage);
    let newBranch = `gitdaily/ai-${compactDate}-${baseSlug}`;

    try {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranch}`,
        sha: headSha,
      });
    } catch {
      const suffix = Math.random().toString(36).slice(2, 6);
      newBranch = `gitdaily/ai-${compactDate}-${baseSlug.slice(0, 24)}-${suffix}`;
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranch}`,
        sha: headSha,
      });
    }

    const { data: baseCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: headSha,
    });

    const treeItems = await Promise.all(
      validatedFiles.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content, "utf-8").toString("base64"),
          encoding: "base64",
        });
        return {
          path: file.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      })
    );

    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: treeItems,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [headSha],
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${newBranch}`,
      sha: newCommit.sha,
    });

    const fileListMarkdown = validatedFiles.map((f) => `- \`${f.path}\``).join("\n");
    const prBody = [
      "### Ringkasan Perubahan (GitDaily AI)",
      "",
      reasoning,
      "",
      "### Daftar File yang Diubah",
      fileListMarkdown,
      "",
      "---",
      `_Dibuat otomatis oleh GitDaily AI pada branch \`${newBranch}\` (${dateKey} WIB)._`,
    ].join("\n");

    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: commitMessage,
      head: newBranch,
      base: baseBranch,
      body: prBody,
    });

    return {
      repo,
      branch: newBranch,
      commitSha: newCommit.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
      prUrl: pr.html_url,
      prNumber: pr.number,
    };
  } catch (error) {
    throw new Error(formatGitHubError(error));
  }
}

export async function createRepositoryWithFiles(
  name: string,
  description: string,
  isPrivate: boolean,
  commitMessage: string,
  files: GeneratedFile[]
): Promise<PushResult> {
  const validatedFiles = validateFilesForCommit(files);
  const octokit = getOctokit();
  const owner = getGitHubUsername();

  try {
    const { data: created } = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: true,
    });

    // Brief pause so GitHub finishes initializing the default branch ref
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const branch = created.default_branch || "main";
    const pushResult = await pushFilesToExistingRepo(created.name, branch, commitMessage, validatedFiles);

    const autoProtect = detectDefaultProtection(
      created.name,
      created.description ?? null,
      null,
      created.private
    );

    await prisma.repository.upsert({
      where: { githubId: created.id },
      update: {
        name: created.name,
        fullName: created.full_name,
        description: created.description,
        defaultBranch: branch,
        isPrivate: created.private,
        ...(autoProtect.isProtected
          ? { isProtected: true, protectionReason: autoProtect.reason }
          : {}),
        lastSyncedAt: new Date(),
      },
      create: {
        githubId: created.id,
        name: created.name,
        fullName: created.full_name,
        description: created.description,
        language: null,
        defaultBranch: branch,
        isPrivate: created.private,
        isProtected: autoProtect.isProtected,
        protectionReason: autoProtect.reason,
        recentCommits: JSON.stringify([
          { sha: pushResult.commitSha.slice(0, 7), message: commitMessage, date: new Date().toISOString() },
        ]),
      },
    });

    return {
      ...pushResult,
      commitUrl: `https://github.com/${owner}/${created.name}/commit/${pushResult.commitSha}`,
    };
  } catch (error) {
    throw new Error(formatGitHubError(error));
  }
}
