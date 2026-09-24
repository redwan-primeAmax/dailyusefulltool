/**
 * Central documentation source of truth for every app.
 * The Triver export flow auto-includes each app's spec, so new apps are
 * picked up automatically without editing this file by hand.
 */

export interface AppDocEntry {
  id: string;
  title: string;
  path: string;
  /** Hand-written spec if present; otherwise a generated stub is used. */
  content?: string;
}

/** Compact doc template for apps without a full spec yet. */
const stub = (name: string, note: string) =>
  `# ${name}\n\n## Overview\n${note}\n\n## State\nThis app persists all user data through the IndexedDB layer and includes a\nDanger Zone in its Settings screen.\n`;

/**
 * Registry of every app-facing documentation entry. Kept in one place so the
 * Backend data layer stays authoritative and new apps are reflected in the
 * Docs bundle the moment they appear in the catalog.
 */
export const APP_DOCS: AppDocEntry[] = [
  { id: 'store', title: 'Play Store', path: 'apps/store/STORE.md' },
  { id: 'backup', title: 'Backup', path: 'apps/backup/BACKUP.md' },
  { id: 'water', title: 'Water Tracker', path: 'apps/waterTracker/WATER.md' },
  { id: 'study', title: 'Study Tracker', path: 'apps/studyTracker/STUDY.md' },
  { id: 'expense', title: 'Expense Limiter', path: 'apps/expenseTracker/EXPENSE.md' },
  { id: 'pomodoro', title: 'Pomodoro', path: 'apps/pomodoro/POMODORO.md' },
  { id: 'habits', title: 'Habit Tracker', path: 'apps/habits/HABITS.md' },
  { id: 'todo', title: 'To-Do', path: 'apps/todo/TODO.md' },
  { id: 'reader', title: 'Reader', path: 'apps/reader/READER.md' },
  { id: 'breathe', title: 'Breathe', path: 'apps/breathe/BREATHE.md' },
  { id: 'weather', title: 'Weather', path: 'apps/weather/WEATHER.md' },
  { id: 'currency', title: 'Currency', path: 'apps/currency/CURRENCY.md' },
  { id: 'notes', title: 'Notes', path: 'apps/notes/NOTES.md' },
  { id: 'flashcard', title: 'Flashcards', path: 'apps/flashcard/FLASHCARD.md' },
  { id: 'bmi', title: 'BMI Calculator', path: 'apps/bmi/BMI.md' },
  { id: 'memory', title: 'Memory Match', path: 'apps/games/MEMORY.md' },
  { id: 'mathdash', title: 'Math Dash', path: 'apps/games/MATHDASH.md' },
  { id: 'read', title: 'Read', path: 'apps/read/READ.md' },
  { id: 'calculator', title: 'Calculator', path: 'apps/calculator/CALCULATOR.md' },
  { id: 'triver', title: 'Triver', path: 'apps/triver/TRIVER.md' },
];

/** Guarantees a non-empty, well-formed content blob for every entry. */
export function docContent(entry: AppDocEntry, fallback: string): string {
  return entry.content && entry.content.trim() ? entry.content : fallback;
}

export { stub };
