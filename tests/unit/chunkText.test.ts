import { describe, expect, it } from "vitest";
import { clampChunkIndex, splitIntoStudyChunks } from "@/lib/chunkText";

describe("splitIntoStudyChunks", () => {
  it("returns empty array for blank input and single chunk for short text", () => {
    expect(splitIntoStudyChunks("   \n\n  ")).toEqual([]);
    expect(splitIntoStudyChunks("Hello world")).toEqual(["Hello world"]);
  });

  it("splits long text near 3000 chars respecting paragraph boundaries", () => {
    const paragraph = "A".repeat(700);
    const fullText = Array.from({ length: 12 }, () => paragraph).join("\n\n");
    const chunks = splitIntoStudyChunks(fullText, 3000, 3500);

    expect(chunks.length).toBeGreaterThanOrEqual(3);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(3500);
      expect(chunk.length).toBeGreaterThan(0);
    }
  });
});

describe("clampChunkIndex", () => {
  it("clamps negative, out-of-bounds, decimal, and non-finite indices safely", () => {
    expect(clampChunkIndex(-5, 10)).toBe(0);
    expect(clampChunkIndex(0, 10)).toBe(0);
    expect(clampChunkIndex(4.9, 10)).toBe(4);
    expect(clampChunkIndex(25, 10)).toBe(9);
    expect(clampChunkIndex(3, 1)).toBe(0);
    expect(clampChunkIndex(3, 0)).toBe(0);
    expect(clampChunkIndex(Number.NaN, 5)).toBe(0);
  });
});
