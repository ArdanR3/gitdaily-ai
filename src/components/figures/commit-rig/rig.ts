export interface CommitRigTelemetry {
  streak: number;
  executedToday: boolean;
  repoCount: number;
  hasActiveMaterial: boolean;
  suggestionCount: number;
}

export const STAGE_NAMES = [
  "01 Sync Repo",
  "02 Study Material",
  "03 Daily Quests",
  "04 Daily Commit",
] as const;

export function getStageHeights(t: CommitRigTelemetry): [number, number, number, number] {
  return [
    t.repoCount > 0 ? 15 : 8,
    t.hasActiveMaterial ? 18 : 8,
    t.suggestionCount > 0 || t.executedToday ? 21 : 9,
    t.executedToday ? 26 : 10,
  ];
}

export function getDefaultStageIndex(t: CommitRigTelemetry): number {
  if (t.executedToday) return 3;
  if (t.suggestionCount > 0) return 2;
  if (t.hasActiveMaterial) return 1;
  return 0;
}

export function formatStageReadout(index: number, t: CommitRigTelemetry): string {
  const safeIdx = Math.max(0, Math.min(3, index));
  const label = STAGE_NAMES[safeIdx];
  if (safeIdx === 0) return `${label} · ${t.repoCount} repo`;
  if (safeIdx === 1) return `${label} · ${t.hasActiveMaterial ? "active" : "idle"}`;
  if (safeIdx === 2) return `${label} · ${t.suggestionCount} quests`;
  return `${label} · ${t.executedToday ? `DONE (${t.streak}d)` : `PENDING (${t.streak}d)`}`;
}
