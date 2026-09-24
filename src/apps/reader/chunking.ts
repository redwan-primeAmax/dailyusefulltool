/**
 * Text chunking utilities for the Reader.
 * Pure functions — no React, no DOM.
 */

export const DEFAULT_CHUNK_SIZE = 3;

/** Splits raw text into whitespace-delimited words, preserving punctuation. */
export function toWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Groups words into fixed-size chunks (last chunk may be shorter). */
export function chunkWords(words: string[], size = DEFAULT_CHUNK_SIZE): string[][] {
  if (size < 1) return [words];
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size));
  }
  return chunks;
}

/** Builds chunks straight from raw text. */
export function buildChunks(text: string, size = DEFAULT_CHUNK_SIZE): string[][] {
  return chunkWords(toWords(text), size);
}

export interface ReaderProgress {
  index: number;
  total: number;
  percent: number;
  wordsRead: number;
  totalWords: number;
}

export function computeProgress(index: number, chunks: string[][], totalWords: number): ReaderProgress {
  const total = chunks.length;
  const wordsRead = chunks.slice(0, index + 1).reduce((sum, c) => sum + c.length, 0);
  return {
    index,
    total,
    percent: total === 0 ? 0 : Math.round(((index + 1) / total) * 100),
    wordsRead: Math.min(wordsRead, totalWords),
    totalWords,
  };
}

/** Rough reading-time estimate at ~200 wpm. */
export function estimateMinutes(totalWords: number): number {
  return Math.max(1, Math.round(totalWords / 200));
}
