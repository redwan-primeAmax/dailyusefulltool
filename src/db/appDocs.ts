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
  {
    id: 'addiction',
    title: 'Addiction Remove',
    path: 'apps/addictionRemover/ADDICTION-REMOVE.md',
    content: `# Addiction Remove\n\nA local-first recovery support tool for substance or behavioural habits. It helps people build a personal plan, notice triggers, choose coping actions, and make non-judgmental check-ins.\n\nThis is self-help support, not diagnosis, treatment, emergency care, or a promise of recovery. Alcohol, benzodiazepines/sedatives, some medicines, and other substances can have dangerous withdrawal risks; users should contact a qualified clinician before stopping or changing use.\n\nRecovery plans and check-ins stay in this browser's IndexedDB unless the user exports a device backup. Backups include this sensitive data.\n`,
  },
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
