export type SuggestionType = "CREATE_REPO" | "UPDATE_REPO";
export type RepoVisibility = "public" | "private";
export type AppMode = "APPROVAL" | "AUTOPILOT";
export type PushMode = "DIRECT_MAIN" | "BRANCH_PR";
export type NotificationChannel = "TELEGRAM" | "DISCORD" | "NONE";
export type SuggestionStatus = "PENDING" | "EXECUTED" | "SKIPPED" | "FAILED";
export type TriggerSource = "MANUAL_APPROVAL" | "AUTOPILOT";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface CommitSummary {
  sha: string;
  message: string;
  date: string;
}

export interface AISuggestionDraft {
  type: SuggestionType;
  target_repo: string;
  visibility: RepoVisibility;
  title: string;
  description?: string;
  reasoning: string;
  files: GeneratedFile[];
}

export interface GitHubProfileSummary {
  username: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  publicRepos: number;
  totalPrivateRepos: number;
}

export interface PushResult {
  repo: string;
  branch: string;
  commitSha: string;
  commitUrl: string;
  prUrl?: string;
  prNumber?: number;
}
