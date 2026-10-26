export type SpeechLanguage = 'bn' | 'en';
export type SpeechLanguageMode = 'auto' | SpeechLanguage;

export interface SpeechChunk {
  text: string;
  language: SpeechLanguage;
}

const MAX_ONLINE_CHUNK_LENGTH = 180;
const BENGALI_SCRIPT = /[\u0980-\u09FF]/u;
const LATIN_LETTER = /[A-Za-z]/u;

function languageForCharacter(character: string): SpeechLanguage | null {
  if (BENGALI_SCRIPT.test(character)) return 'bn';
  if (LATIN_LETTER.test(character)) return 'en';
  return null;
}

function splitLongText(text: string, maxLength = MAX_ONLINE_CHUNK_LENGTH): string[] {
  const remaining = Array.from(text.trim());
  const chunks: string[] = [];

  while (remaining.length > maxLength) {
    let cutAt = maxLength;
    const searchFloor = Math.floor(maxLength * 0.55);
    for (let index = maxLength; index >= searchFloor; index -= 1) {
      if (/\s/u.test(remaining[index - 1] ?? '')) {
        cutAt = index;
        break;
      }
    }
    const chunk = remaining.splice(0, cutAt).join('').trim();
    if (chunk) chunks.push(chunk);
    while (/\s/u.test(remaining[0] ?? '')) remaining.shift();
  }

  const lastChunk = remaining.join('').trim();
  if (lastChunk) chunks.push(lastChunk);
  return chunks;
}

/** Split mixed Bengali/English input into short, language-tagged speech chunks. */
export function splitTextForSpeech(text: string, mode: SpeechLanguageMode = 'auto'): SpeechChunk[] {
  const cleanText = text.trim();
  if (!cleanText) return [];

  const languageRuns: SpeechChunk[] = [];
  if (mode !== 'auto') {
    languageRuns.push({ text: cleanText, language: mode });
  } else {
    let activeLanguage: SpeechLanguage = 'en';
    let buffer = '';
    for (const character of cleanText) {
      const detected = languageForCharacter(character);
      if (detected && detected !== activeLanguage && buffer.trim()) {
        languageRuns.push({ text: buffer.trim(), language: activeLanguage });
        buffer = '';
      }
      if (detected) activeLanguage = detected;
      buffer += character;
    }
    if (buffer.trim()) languageRuns.push({ text: buffer.trim(), language: activeLanguage });
  }

  return languageRuns.flatMap(({ text: run, language }) =>
    splitLongText(run).map((chunk) => ({ text: chunk, language })),
  );
}

/**
 * Build a keyless Google Translate listen URL for a short MP3 segment.
 * This public endpoint is unofficial and can be rate-limited or changed.
 */
export function createOnlineSpeechUrl(chunk: SpeechChunk): string {
  const url = new URL('https://translate.google.com/translate_tts');
  url.searchParams.set('ie', 'UTF-8');
  url.searchParams.set('client', 'tw-ob');
  url.searchParams.set('tl', chunk.language);
  url.searchParams.set('q', chunk.text);
  url.searchParams.set('total', '1');
  url.searchParams.set('idx', '0');
  url.searchParams.set('textlen', String(Array.from(chunk.text).length));
  return url.toString();
}
