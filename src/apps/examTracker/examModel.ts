import type { ExamCategory, ExamSubject, ExamTrackerSettings } from '../../types';

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const SUBJECT_COLORS = ['#34d399', '#38bdf8', '#fbbf24', '#a78bfa', '#fb7185', '#2dd4bf'];

export type ExamPage = 'home' | 'today' | 'addSubject' | 'settings';

export interface ParsedExamCategory {
  name: string;
  instructions: string;
  topics: string[];
  recommendedMinutes: number;
}

export interface ParsedExamSubject {
  subject: string;
  categories: ParsedExamCategory[];
}

export interface SubjectValidationSuccess {
  ok: true;
  value: ParsedExamSubject;
}

export interface SubjectValidationFailure {
  ok: false;
  errors: string[];
}

export type SubjectValidationResult = SubjectValidationSuccess | SubjectValidationFailure;

export interface SubjectImportValidationSuccess {
  ok: true;
  value: ParsedExamSubject[];
}

export interface SubjectImportValidationFailure {
  ok: false;
  errors: string[];
}

export type SubjectImportValidationResult = SubjectImportValidationSuccess | SubjectImportValidationFailure;

export interface ProgressSummary {
  totalCategories: number;
  completedCategories: number;
  completionPercent: number;
  remainingPercent: number | null;
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `exam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeExamSettings(value: unknown): ExamTrackerSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { subjects: [], geminiApiKey: '' };
  const raw = value as Record<string, unknown>;
  const subjects = Array.isArray(raw.subjects) ? raw.subjects.slice(0, 100).flatMap((item, subjectIndex) => {
    if (!isRecord(item)) return [];
    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 100) : '';
    if (!name || !Array.isArray(item.categories)) return [];
    const categories: ExamCategory[] = item.categories.slice(0, 40).flatMap((category) => {
      if (!isRecord(category)) return [];
      const categoryName = typeof category.name === 'string' ? category.name.trim().slice(0, 80) : '';
      const instructions = typeof category.instructions === 'string' ? category.instructions.slice(0, 4_000) : '';
      if (!categoryName || !instructions.trim()) return [];
      const recommendedMinutes = typeof category.recommendedMinutes === 'number'
        && Number.isFinite(category.recommendedMinutes)
        ? Math.max(5, Math.min(600, Math.round(category.recommendedMinutes)))
        : 45;
      return [{
        id: typeof category.id === 'string' && category.id ? category.id : createId(),
        name: categoryName,
        instructions,
        topics: Array.isArray(category.topics)
          ? category.topics
            .filter((topic): topic is string => typeof topic === 'string')
            .map((topic) => topic.trim().slice(0, 120))
            .filter(Boolean)
            .slice(0, 50)
          : [],
        recommendedMinutes,
        completed: category.completed === true,
        ...(typeof category.completedAt === 'number' ? { completedAt: category.completedAt } : {}),
      }];
    });
    return [{
      id: typeof item.id === 'string' && item.id ? item.id : `exam-subject-${subjectIndex}-${createId()}`,
      name,
      color: typeof item.color === 'string' && /^#[\da-f]{6}$/i.test(item.color)
        ? item.color
        : SUBJECT_COLORS[subjectIndex % SUBJECT_COLORS.length],
      categories,
    }];
  }) : [];
  return {
    subjects,
    geminiApiKey: typeof raw.geminiApiKey === 'string' ? raw.geminiApiKey.slice(0, 300) : '',
  };
}

export function getProgressSummary(subjects: ExamSubject[]): ProgressSummary {
  const totalCategories = subjects.reduce((total, subject) => total + subject.categories.length, 0);
  const completedCategories = subjects.reduce(
    (total, subject) => total + subject.categories.filter((category) => category.completed).length,
    0,
  );
  const completionPercent = totalCategories > 0 ? (completedCategories / totalCategories) * 100 : 0;
  return {
    totalCategories,
    completedCategories,
    completionPercent,
    remainingPercent: totalCategories > 0 ? 100 - completionPercent : null,
  };
}

export function getSubjectRemainingPercent(subject: ExamSubject): number | null {
  if (subject.categories.length === 0) return null;
  const completed = subject.categories.filter((category) => category.completed).length;
  return ((subject.categories.length - completed) / subject.categories.length) * 100;
}

/** Builds a detailed, editable JSON starter that can be copied or sent to Gemini. */
export function createSubjectJsonTemplate(subjectName: string, categoryNames: string[]): string {
  const subject = subjectName.trim() || 'Bengali';
  const categories = categoryNames.length > 0 ? categoryNames : ['Essays', 'Comprehension', 'Poetry'];
  return JSON.stringify({
    subject,
    categories: categories.map((name) => ({
      name,
      topics: [],
      instructions: `Review the core ideas in ${name}, summarize them from memory, then practise a timed exam question and check your answer.`,
      recommendedMinutes: 45,
    })),
  }, null, 2);
}

function stripCodeFence(input: string): string {
  const trimmed = input.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function validateSubjectJson(input: string, expectedSubjectName = ''): SubjectValidationResult {
  if (!input.trim()) return { ok: false, errors: ['Paste a subject JSON object before selecting Done.'] };
  if (input.length > 100_000) {
    return { ok: false, errors: ['The JSON input is too large. Keep it under 100 KB.'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(input));
  } catch {
    return {
      ok: false,
      errors: ['Invalid JSON syntax. Check for a missing comma, quotation mark, or closing bracket.'],
    };
  }

  if (!isRecord(parsed)) return { ok: false, errors: ['The JSON root must be an object.'] };

  const errors: string[] = [];
  const subject = typeof parsed.subject === 'string' ? parsed.subject.trim() : '';
  if (!subject) errors.push('"subject" must be a non-empty string.');
  else if (subject.length > 100) errors.push('"subject" must be 100 characters or fewer.');

  const expected = expectedSubjectName.trim();
  if (expected && subject && subject.toLocaleLowerCase() !== expected.toLocaleLowerCase()) {
    errors.push(`The JSON subject "${subject}" does not match the Subject Name field "${expected}".`);
  }

  if (!Array.isArray(parsed.categories)) {
    errors.push('"categories" must be an array.');
    return { ok: false, errors };
  }
  if (parsed.categories.length === 0) errors.push('Add at least one category.');
  if (parsed.categories.length > 40) errors.push('A subject can contain no more than 40 categories.');

  const categories: ParsedExamCategory[] = [];
  const seenNames = new Set<string>();
  parsed.categories.slice(0, 40).forEach((rawCategory, index) => {
    const path = `categories[${index}]`;
    if (!isRecord(rawCategory)) {
      errors.push(`${path} must be an object.`);
      return;
    }

    const name = typeof rawCategory.name === 'string' ? rawCategory.name.trim() : '';
    if (!name) errors.push(`${path}.name must be a non-empty string.`);
    else if (name.length > 80) errors.push(`${path}.name must be 80 characters or fewer.`);
    if (name) {
      const normalized = name.toLocaleLowerCase();
      if (seenNames.has(normalized)) errors.push(`${path}.name duplicates another category: "${name}".`);
      seenNames.add(normalized);
    }

    const instructions = typeof rawCategory.instructions === 'string' ? rawCategory.instructions.trim() : '';
    if (!instructions) errors.push(`${path}.instructions must contain detailed study guidance.`);
    else if (instructions.length > 4_000) errors.push(`${path}.instructions must be 4,000 characters or fewer.`);

    let topics: string[] = [];
    if (rawCategory.topics !== undefined) {
      if (!Array.isArray(rawCategory.topics)) {
        errors.push(`${path}.topics must be an array of strings.`);
      } else if (rawCategory.topics.length > 50) {
        errors.push(`${path}.topics can contain no more than 50 items.`);
      } else {
        topics = rawCategory.topics.map((topic, topicIndex) => {
          if (typeof topic !== 'string' || !topic.trim()) {
            errors.push(`${path}.topics[${topicIndex}] must be a non-empty string.`);
            return '';
          }
          if (topic.trim().length > 120) errors.push(`${path}.topics[${topicIndex}] must be 120 characters or fewer.`);
          return topic.trim();
        }).filter(Boolean);
      }
    }

    const recommendedMinutes = rawCategory.recommendedMinutes === undefined
      ? 45
      : rawCategory.recommendedMinutes;
    if (
      typeof recommendedMinutes !== 'number'
      || !Number.isInteger(recommendedMinutes)
      || recommendedMinutes < 5
      || recommendedMinutes > 600
    ) {
      errors.push(`${path}.recommendedMinutes must be a whole number from 5 to 600.`);
    }

    if (name && instructions && typeof recommendedMinutes === 'number' && Number.isInteger(recommendedMinutes)) {
      categories.push({ name, instructions, topics, recommendedMinutes });
    }
  });

  if (errors.length > 0) {
    const visibleErrors = errors.slice(0, 50);
    if (errors.length > visibleErrors.length) {
      visibleErrors.push(`${errors.length - visibleErrors.length} additional validation issue(s) were omitted.`);
    }
    return { ok: false, errors: visibleErrors };
  }
  return { ok: true, value: { subject, categories } };
}

function decodeImportedSubject(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const decodeText = (text: unknown) => typeof text === 'string' ? text.replace(/&amp;/gi, '&') : text;
  return {
    ...value,
    subject: decodeText(value.subject),
    categories: Array.isArray(value.categories)
      ? value.categories.map((category) => {
        if (!isRecord(category)) return category;
        return {
          ...category,
          name: decodeText(category.name),
          instructions: decodeText(category.instructions),
          topics: Array.isArray(category.topics) ? category.topics.map(decodeText) : category.topics,
        };
      })
      : value.categories,
  };
}

function limitedErrors(errors: string[]): string[] {
  const visibleErrors = errors.slice(0, 50);
  if (errors.length > visibleErrors.length) {
    visibleErrors.push(`${errors.length - visibleErrors.length} additional validation issue(s) were omitted.`);
  }
  return visibleErrors;
}

/**
 * Accepts the single-subject shape, a top-level array, or { subjects: [...] }.
 * API/template generation remains single-subject; this importer supports bulk
 * plans commonly copied as a JSON array.
 */
export function validateSubjectImportJson(input: string, expectedSubjectName = ''): SubjectImportValidationResult {
  if (!input.trim()) {
    return { ok: false, errors: ['Paste a subject object or an array of subjects before selecting Done.'] };
  }
  if (input.length > 100_000) {
    return { ok: false, errors: ['The JSON input is too large. Keep it under 100 KB.'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(input));
  } catch {
    const singleResult = validateSubjectJson(input, expectedSubjectName);
    return singleResult.ok ? { ok: true, value: [singleResult.value] } : singleResult;
  }

  if (Array.isArray(parsed)) return validateSubjectBatch(parsed);
  if (isRecord(parsed) && Array.isArray(parsed.subjects)) return validateSubjectBatch(parsed.subjects);
  if (!isRecord(parsed)) {
    return {
      ok: false,
      errors: ['The JSON root must be a subject object, an array of subject objects, or an object with a "subjects" array.'],
    };
  }

  const decoded = JSON.stringify(decodeImportedSubject(parsed));
  const result = validateSubjectJson(decoded, expectedSubjectName);
  return result.ok ? { ok: true, value: [result.value] } : result;
}

function validateSubjectBatch(items: unknown[]): SubjectImportValidationResult {
  const errors: string[] = [];
  if (items.length === 0) return { ok: false, errors: ['The subject list is empty. Add at least one subject.'] };
  if (items.length > 100) errors.push('A JSON import can contain no more than 100 subjects.');

  const validItems: Array<{ subject: ParsedExamSubject; index: number }> = [];
  items.slice(0, 100).forEach((item, index) => {
    const decoded = JSON.stringify(decodeImportedSubject(item));
    const result = validateSubjectJson(decoded);
    if (!result.ok) {
      for (const error of result.errors) {
        if (error.startsWith('categories[')) {
          errors.push(`subjects[${index}].${error}`);
        } else if (error.startsWith('"subject"')) {
          errors.push(`subjects[${index}].${error.replace('"subject"', 'subject')}`);
        } else {
          errors.push(`subjects[${index}]: ${error}`);
        }
      }
      return;
    }
    validItems.push({ subject: result.value, index });
  });

  const seenSubjects = new Map<string, number>();
  validItems.forEach(({ subject, index }) => {
    const normalized = subject.subject.toLocaleLowerCase();
    const previousIndex = seenSubjects.get(normalized);
    if (previousIndex !== undefined) {
      errors.push(`subjects[${index}].subject duplicates the subject at subjects[${previousIndex}]: "${subject.subject}".`);
    } else {
      seenSubjects.set(normalized, index);
    }
  });

  if (errors.length > 0) return { ok: false, errors: limitedErrors(errors) };
  return { ok: true, value: validItems.map(({ subject }) => subject) };
}

export function categoryToExamCategory(category: ParsedExamCategory): ExamCategory {
  return {
    id: createId(),
    name: category.name,
    instructions: category.instructions,
    topics: [...category.topics],
    recommendedMinutes: category.recommendedMinutes,
    completed: false,
  };
}

export function buildTodayPlan(subjects: ExamSubject[]) {
  return subjects.flatMap((subject) => {
    const category = subject.categories.find((item) => !item.completed);
    return category ? [{ subject, category }] : [];
  });
}
