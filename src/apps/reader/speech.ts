/**
 * Fuzzy voice-command detection for the Reader.
 *
 * Browser speech APIs are noisy and accents vary widely, so instead of exact
 * string matching we score each transcript against a set of phonetic variants
 * using normalised Levenshtein distance plus substring heuristics.
 */

export type VoiceCommand = 'next' | 'previous' | 'pause' | 'restart';

/** Known mishearings collected for each command. */
const VARIANTS: Record<VoiceCommand, string[]> = {
  next: [
    'next', 'nex', 'necks', 'nekst', 'nest', 'text', 'nekst', 'nexed', 'net',
    'nixt', 'naxt', 'knicks', 'nix', 'neks', 'nexr', 'forward', 'go', 'continue',
  ],
  previous: [
    'previous', 'prev', 'previus', 'prewious', 'previews', 'preview', 'back',
    'bak', 'go back', 'last', 'behind', 'reverse',
  ],
  pause: ['pause', 'paws', 'pose', 'stop', 'halt', 'wait'],
  restart: ['restart', 're start', 'start over', 'reset', 'begin', 'again'],
};

/** Classic Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** 0..1 similarity where 1 is an exact match. */
export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

export function normalise(input: string): string {
  return input.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
}

export interface MatchResult {
  command: VoiceCommand | null;
  confidence: number;
  matchedToken: string;
}

/**
 * Scores a raw transcript against every command variant.
 * `threshold` defaults to 0.62 which reliably accepts slurred "next"
 * while rejecting unrelated speech.
 */
export function detectCommand(transcript: string, threshold = 0.62): MatchResult {
  const clean = normalise(transcript);
  if (!clean) return { command: null, confidence: 0, matchedToken: '' };

  const tokens = [clean, ...clean.split(' ')];
  let best: MatchResult = { command: null, confidence: 0, matchedToken: '' };

  for (const [command, variants] of Object.entries(VARIANTS) as [VoiceCommand, string[]][]) {
    for (const variant of variants) {
      for (const token of tokens) {
        if (!token) continue;
        // Direct containment is a strong signal (e.g. "okay next please").
        const contains = token.includes(variant) || variant.includes(token);
        const score = contains
          ? Math.max(0.9, similarity(token, variant))
          : similarity(token, variant);
        if (score > best.confidence) {
          best = { command, confidence: score, matchedToken: token };
        }
      }
    }
  }

  return best.confidence >= threshold ? best : { command: null, confidence: best.confidence, matchedToken: best.matchedToken };
}

/* ------------------------------------------------------------------ */
/*  Web Speech API typings (not in lib.dom for all TS versions)        */
/* ------------------------------------------------------------------ */

export interface SpeechRecognitionAlternativeLike { transcript: string; confidence: number }
export interface SpeechRecognitionResultLike {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}
export interface SpeechRecognitionResultListLike {
  readonly length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}
export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}
export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Returns the vendor-prefixed constructor when the browser supports it. */
export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const isSpeechSupported = (): boolean => getSpeechRecognition() !== null;
