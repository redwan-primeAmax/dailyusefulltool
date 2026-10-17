const WORD_PATTERN = /(?:https?:\/\/|www\.)[^\s<>()]+|[\p{L}\p{M}\p{N}\u200c\u200d]+(?:['’][\p{L}\p{M}\p{N}\u200c\u200d]+)*(?:[.,٫٬][\p{N}]+)*/giu;
const NUMBER_PATTERN = /^\p{N}+(?:[.,٫٬]\p{N}+)*$/u;
const URL_PATTERN = /^(?:https?:\/\/|www\.)/iu;
const SENTENCE_END_PATTERN = /[.!?।॥؟۔。．！？]+(?:["'”’)\]]+)?/u;
const URL_MATCH_PATTERN = /(?:https?:\/\/|www\.)[^\s<>()]+/giu;

export interface WordFrequency {
  word: string;
  count: number;
}

export interface WordCounterStats {
  words: number;
  characters: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  uniqueWords: number;
  vocabularyDiversity: number;
  averageWordLength: number;
  averageSentenceLength: number;
  longestWord: string;
  shortestWord: string;
  readingSeconds: number;
  speakingSeconds: number;
  estimatedPages: number;
  punctuationMarks: number;
  numbers: number;
  letters: number;
  uppercaseLetters: number;
  lowercaseLetters: number;
  whitespaceCharacters: number;
  urls: number;
  topWords: WordFrequency[];
}

interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>;
}

type GraphemeSegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' },
) => GraphemeSegmenter;

const Segmenter = (Intl as unknown as { Segmenter?: GraphemeSegmenterConstructor }).Segmenter;
const graphemeSegmenter = Segmenter ? new Segmenter(undefined, { granularity: 'grapheme' }) : null;

function splitGraphemes(value: string): string[] {
  if (graphemeSegmenter) return Array.from(graphemeSegmenter.segment(value), (item) => item.segment);
  return Array.from(value);
}

function tokenize(text: string): string[] {
  return (text.match(WORD_PATTERN) ?? [])
    .map((word) => URL_PATTERN.test(word) ? word.replace(/[.,!?;:]+$/u, '') : word)
    .filter((word) => word.length > 0);
}

function countMatches(text: string, pattern: RegExp): number {
  return Array.from(text.matchAll(pattern)).length;
}

function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  // Ignore punctuation inside URLs and decimal numbers before finding sentence marks.
  const withoutUrls = text.replace(URL_MATCH_PATTERN, (url) => {
    const withoutTrailingPunctuation = url.replace(/[.,!?;:]+$/u, '');
    const trailingPunctuation = url.slice(withoutTrailingPunctuation.length);
    return ` urltoken ${trailingPunctuation}`;
  });
  const withoutDecimalPoints = withoutUrls.replace(/(?<=[\p{N}])[.,٫٬](?=[\p{N}])/gu, '');
  return withoutDecimalPoints
    .split(SENTENCE_END_PATTERN)
    .filter((sentence) => tokenize(sentence).length > 0);
}

export function analyzeText(text: string): WordCounterStats {
  const words = tokenize(text);
  const normalizedText = text.replace(/\r\n?/g, '\n');
  const trimmed = normalizedText.trim();
  const graphemes = splitGraphemes(text);
  const sentences = splitSentences(text);
  const unique = new Set(words.map((word) => word.normalize('NFC').toLocaleLowerCase()));
  const frequencies = new Map<string, WordFrequency>();

  for (const word of words) {
    const normalized = word.normalize('NFC').toLocaleLowerCase();
    const current = frequencies.get(normalized);
    if (current) current.count += 1;
    else frequencies.set(normalized, { word, count: 1 });
  }

  const wordLengths = words.map((word) => splitGraphemes(word).length);
  let longestIndex = -1;
  let shortestIndex = -1;
  let totalWordLength = 0;
  wordLengths.forEach((length, index) => {
    totalWordLength += length;
    if (longestIndex < 0 || length > wordLengths[longestIndex]) longestIndex = index;
    if (shortestIndex < 0 || length < wordLengths[shortestIndex]) shortestIndex = index;
  });
  const averageWordLength = words.length > 0
    ? Math.round((totalWordLength / words.length) * 10) / 10
    : 0;

  const lines = text.length > 0 ? normalizedText.split('\n').length : 0;
  const paragraphs = trimmed
    ? trimmed.split(/\n[\t ]*\n+/u).filter((paragraph) => paragraph.trim().length > 0).length
    : 0;
  const uniqueWords = unique.size;

  return {
    words: words.length,
    characters: graphemes.length,
    charactersWithoutSpaces: graphemes.filter((grapheme) => !/^\s+$/u.test(grapheme)).length,
    sentences: sentences.length,
    paragraphs,
    lines,
    uniqueWords,
    vocabularyDiversity: words.length > 0 ? Math.round((uniqueWords / words.length) * 1000) / 10 : 0,
    averageWordLength,
    averageSentenceLength: sentences.length > 0 ? Math.round((words.length / sentences.length) * 10) / 10 : 0,
    longestWord: longestIndex >= 0 ? words[longestIndex] : '',
    shortestWord: shortestIndex >= 0 ? words[shortestIndex] : '',
    readingSeconds: words.length > 0 ? Math.ceil((words.length / 200) * 60) : 0,
    speakingSeconds: words.length > 0 ? Math.ceil((words.length / 130) * 60) : 0,
    estimatedPages: words.length > 0 ? Math.max(0.1, Math.round((words.length / 500) * 10) / 10) : 0,
    punctuationMarks: countMatches(text, /\p{P}/gu),
    numbers: words.filter((word) => NUMBER_PATTERN.test(word)).length,
    letters: countMatches(text, /\p{L}/gu),
    uppercaseLetters: countMatches(text, /\p{Lu}/gu),
    lowercaseLetters: countMatches(text, /\p{Ll}/gu),
    whitespaceCharacters: countMatches(text, /\s/gu),
    urls: countMatches(text, /(?:https?:\/\/|www\.)[^\s<>()]+/giu),
    topWords: Array.from(frequencies.values())
      .filter((item) => item.count > 1)
      .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
      .slice(0, 8),
  };
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 sec';
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} min`;
  return `${minutes} min ${remainingSeconds} sec`;
}

export function createStatsReport(stats: WordCounterStats): string {
  const rows = [
    ['Words', stats.words],
    ['Characters (with spaces)', stats.characters],
    ['Characters (without spaces)', stats.charactersWithoutSpaces],
    ['Sentences', stats.sentences],
    ['Paragraphs', stats.paragraphs],
    ['Lines', stats.lines],
    ['Unique words', stats.uniqueWords],
    ['Vocabulary diversity', `${stats.vocabularyDiversity}%`],
    ['Average word length', `${stats.averageWordLength} characters`],
    ['Average sentence length', `${stats.averageSentenceLength} words`],
    ['Estimated reading time', formatDuration(stats.readingSeconds)],
    ['Estimated speaking time', formatDuration(stats.speakingSeconds)],
    ['Estimated pages', stats.estimatedPages],
    ['Punctuation marks', stats.punctuationMarks],
    ['Number tokens', stats.numbers],
    ['Letters', stats.letters],
    ['Uppercase letters', stats.uppercaseLetters],
    ['Lowercase letters', stats.lowercaseLetters],
    ['Whitespace characters', stats.whitespaceCharacters],
    ['URLs', stats.urls],
  ];
  const frequentWords = stats.topWords.length > 0
    ? stats.topWords.map((item) => `${item.word}: ${item.count}`).join(', ')
    : 'None';
  return [
    'Word Counter — Text Analysis',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    `Longest word: ${stats.longestWord || '—'}`,
    `Shortest word: ${stats.shortestWord || '—'}`,
    `Most repeated words: ${frequentWords}`,
  ].join('\n');
}
