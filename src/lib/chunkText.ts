/**
 * Splits study material text into 2,500–3,500 character chunks,
 * preferring paragraph or line boundaries for cleaner AI context.
 */
export function splitIntoStudyChunks(rawText: string, targetSize = 3000, maxSize = 3500): string[] {
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  if (normalized.length <= maxSize) return [normalized];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const remaining = normalized.length - cursor;
    if (remaining <= maxSize) {
      chunks.push(normalized.slice(cursor).trim());
      break;
    }

    let splitAt = cursor + targetSize;
    const searchWindow = normalized.slice(cursor + 2200, Math.min(normalized.length, cursor + maxSize));
    const doubleNewline = searchWindow.lastIndexOf("\n\n");
    const singleNewline = searchWindow.lastIndexOf("\n");
    const periodSpace = searchWindow.lastIndexOf(". ");

    if (doubleNewline !== -1) {
      splitAt = cursor + 2200 + doubleNewline + 2;
    } else if (singleNewline !== -1) {
      splitAt = cursor + 2200 + singleNewline + 1;
    } else if (periodSpace !== -1) {
      splitAt = cursor + 2200 + periodSpace + 2;
    }

    const piece = normalized.slice(cursor, splitAt).trim();
    if (piece) chunks.push(piece);
    cursor = splitAt;
  }

  return chunks;
}

export function clampChunkIndex(requested: number, totalChunks: number): number {
  const maxValidIndex = Math.max(0, Math.floor(totalChunks) - 1);
  if (!Number.isFinite(requested)) return 0;
  return Math.min(maxValidIndex, Math.max(0, Math.floor(requested)));
}
