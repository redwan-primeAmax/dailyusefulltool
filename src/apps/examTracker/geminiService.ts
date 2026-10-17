import { GEMINI_MODEL } from './examModel';

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
}

interface GeminiPayload {
  candidates?: GeminiCandidate[];
  error?: { message?: string; status?: string };
}

function errorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const error = (payload as GeminiPayload).error;
  return typeof error?.message === 'string' && error.message.trim() ? error.message : fallback;
}

export async function callGeminiJson(apiKey: string, prompt: string): Promise<string> {
  const key = apiKey.trim();
  if (!key) throw new Error('Add your Gemini API key in Settings before using Gemini.');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45_000);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.25,
          maxOutputTokens: 4096,
        },
      }),
    });

    let rawPayload: unknown;
    try {
      rawPayload = await response.json();
    } catch {
      throw new Error(`Gemini returned an unreadable response (HTTP ${response.status}).`);
    }
    if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
      throw new Error(`Gemini returned an invalid response body (HTTP ${response.status}).`);
    }
    const payload = rawPayload as GeminiPayload;

    if (!response.ok) {
      const details = errorMessage(payload, `Gemini request failed with HTTP ${response.status}.`);
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Gemini rejected this API key. Check the key and its API permissions. ${details}`);
      }
      if (response.status === 429) {
        throw new Error(`Gemini rate limit reached. Wait a moment and try again. ${details}`);
      }
      throw new Error(details);
    }

    const firstCandidate = Array.isArray(payload.candidates) ? payload.candidates[0] : undefined;
    const candidate = firstCandidate && typeof firstCandidate === 'object' && !Array.isArray(firstCandidate)
      ? firstCandidate as GeminiCandidate
      : undefined;
    const parts = candidate?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((part) => part && typeof part === 'object' && typeof part.text === 'string' ? part.text : '').join('').trim()
      : '';
    if (!text) throw new Error('Gemini returned no JSON content. Try again or paste a JSON response manually.');
    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The Gemini request timed out after 45 seconds. Please try again.');
    }
    if (error instanceof TypeError) {
      throw new Error('Could not reach Gemini. Check your internet connection and browser network permissions.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function testGeminiConnection(apiKey: string): Promise<void> {
  const response = await callGeminiJson(
    apiKey,
    'Return only this JSON object: {"status":"connected"}. Do not add any other fields.',
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(response);
  } catch {
    throw new Error('Gemini responded, but the test response was not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || (parsed as { status?: unknown }).status !== 'connected') {
    throw new Error('Gemini responded, but the connection test returned an unexpected result.');
  }
}

export function createSubjectGenerationPrompt(subject: string, categoryNames: string[]): string {
  const categories = categoryNames.length > 0 ? categoryNames : ['Core concepts', 'Practice questions'];
  return [
    'Create an exam study breakdown and return only valid JSON matching this exact schema:',
    '{"subject":"string","categories":[{"name":"string","topics":["string"],"instructions":"string","recommendedMinutes":45}]}',
    `Subject: ${subject.trim()}`,
    `Categories to cover: ${categories.join(', ')}`,
    'Write every generated value in English. Give each category concise but detailed, practical exam-study instructions, 3 to 6 specific topics, and a realistic recommendedMinutes value from 5 to 600.',
    'Do not wrap the JSON in Markdown fences. Do not add comments or extra top-level fields.',
  ].join('\n');
}
