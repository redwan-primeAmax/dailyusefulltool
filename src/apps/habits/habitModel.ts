/**
 * Habit domain model — schedules, streaks and archive helpers.
 * Pure logic, no React.
 */

import { lastDateKeys, toDateKey } from '../../utils/date';

export type ScheduleKind = 'daily' | 'weekdays' | 'timesPerWeek';

export interface HabitSchedule {
  kind: ScheduleKind;
  /** 0 = Sunday … 6 = Saturday. Used when kind === 'weekdays'. */
  days: number[];
  /** Target completions per week when kind === 'timesPerWeek'. */
  timesPerWeek: number;
}

export interface Habit {
  id: string;
  ts: number;
  dateKey: string;
  name: string;
  emoji: string;
  color: string;
  completions: string[];
  schedule: HabitSchedule;
  archived: boolean;
  /** Timestamp of the last archive action, for sorting the archive list. */
  archivedAt?: number;
}

export const HABIT_STORE = 'habits';

export const DEFAULT_SCHEDULE: HabitSchedule = {
  kind: 'daily',
  days: [1, 2, 3, 4, 5],
  timesPerWeek: 3,
};

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Ensures habits saved before scheduling/archiving existed still work. */
export function normaliseHabit(raw: Partial<Habit> & { id: string }): Habit {
  return {
    id: raw.id,
    ts: raw.ts ?? Date.now(),
    dateKey: raw.dateKey ?? toDateKey(new Date()),
    name: raw.name ?? 'Habit',
    emoji: raw.emoji ?? '🎯',
    color: raw.color ?? '#0ea5e9',
    completions: Array.isArray(raw.completions) ? raw.completions : [],
    schedule: raw.schedule ?? { ...DEFAULT_SCHEDULE },
    archived: raw.archived ?? false,
    archivedAt: raw.archivedAt,
  };
}

/** Human-readable summary of a schedule, e.g. "Mon, Wed, Fri". */
export function describeSchedule(schedule: HabitSchedule): string {
  if (schedule.kind === 'daily') return 'Every day';
  if (schedule.kind === 'timesPerWeek') {
    return `${schedule.timesPerWeek}× per week`;
  }
  if (schedule.days.length === 0) return 'No days selected';
  if (schedule.days.length === 7) return 'Every day';
  return schedule.days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_NAMES[d])
    .join(', ');
}

/** True when the habit is expected on the supplied date key. */
export function isScheduledOn(schedule: HabitSchedule, dateKey: string): boolean {
  if (schedule.kind === 'daily') return true;
  if (schedule.kind === 'timesPerWeek') return true; // flexible — any day counts
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = new Date(y, (m ?? 1) - 1, d ?? 1).getDay();
  return schedule.days.includes(weekday);
}

/** Consecutive-day streak, tolerant of days the habit isn't scheduled. */
export function computeStreak(habit: Habit, today = toDateKey(new Date())): number {
  const keys = lastDateKeys(90).reverse(); // newest first
  let streak = 0;
  for (const key of keys) {
    if (!isScheduledOn(habit.schedule, key)) continue; // skip rest days
    if (habit.completions.includes(key)) {
      streak += 1;
      continue;
    }
    if (key === today) continue; // today still pending — don't break the run
    break;
  }
  return streak;
}

/** Completions inside the current 7-day window. */
export function weeklyCount(habit: Habit): number {
  const week = new Set(lastDateKeys(7));
  return habit.completions.filter((c) => week.has(c)).length;
}

/** Progress toward the weekly target (0..1) for flexible schedules. */
export function weeklyProgress(habit: Habit): number {
  if (habit.schedule.kind !== 'timesPerWeek') return 0;
  const target = Math.max(1, habit.schedule.timesPerWeek);
  return Math.min(1, weeklyCount(habit) / target);
}
