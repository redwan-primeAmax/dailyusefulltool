import { DAY_MS, lastDateKeys, toDateKey } from '../../utils/date';

export type Priority = 'low' | 'medium' | 'high';
export type TodoStatus = 'active' | 'done' | 'expired';

export interface Todo {
  id: string;
  ts: number;
  dateKey: string;
  text: string;
  done: boolean;
  priority: Priority;
  starred: boolean;
  startDate: string;
  endDate: string;
  completedAt?: number;
  expired?: boolean;
}

export const TODO_STORE = 'todos';

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: '#1f2937',
  medium: '#d9a441',
  high: '#a3e635',
};

export const PRIORITY_INK: Record<Priority, string> = {
  low: '#94a3b8',
  medium: '#d9a441',
  high: '#a3e635',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function normalizeTodo(raw: Partial<Todo> & { id: string }): Todo {
  const today = toDateKey(new Date());
  return {
    id: raw.id,
    ts: raw.ts ?? Date.now(),
    dateKey: raw.dateKey || today,
    text: raw.text ?? 'Task',
    done: raw.done ?? false,
    priority: raw.priority ?? 'medium',
    starred: raw.starred ?? false,
    startDate: raw.startDate || raw.dateKey || today,
    endDate: raw.endDate || raw.dateKey || today,
    completedAt: raw.completedAt,
    expired: raw.expired ?? false,
  };
}

/** Last millisecond of the supplied `YYYY-MM-DD` day (NaN-safe). */
export function endOfDateKey(key: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return Number.NaN;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

/**
 * Expires a task whose deadline has fully passed without completion.
 * Tasks already marked done are never retroactively expired.
 */
export function autoExpire(todo: Todo, now = Date.now()): Todo {
  if (todo.done) return todo.expired ? { ...todo, expired: false } : todo;
  const deadline = endOfDateKey(todo.endDate);
  const shouldExpire = Number.isFinite(deadline) && now > deadline;
  return shouldExpire === todo.expired ? todo : { ...todo, expired: shouldExpire };
}

export function todoStatus(todo: Todo): TodoStatus {
  if (todo.done) return 'done';
  if (todo.expired) return 'expired';
  return 'active';
}

export function isDueInRange(todo: Todo, key: string): boolean {
  return key >= todo.startDate && key <= todo.endDate;
}

export function rangeLabel(todo: Todo): string {
  if (todo.startDate === todo.endDate) return todo.endDate;
  return `${todo.startDate} → ${todo.endDate}`;
}

export function completionRate(todos: Todo[]): number {
  if (todos.length === 0) return 100;
  return Math.round((todos.filter((t) => t.done).length / todos.length) * 100);
}

export function consistencyScore(todos: Todo[]): number {
  const completedOrMissed = todos.filter((t) => t.done || t.expired);
  if (completedOrMissed.length === 0) return 100;
  return Math.round((completedOrMissed.filter((t) => t.done).length / completedOrMissed.length) * 100);
}

/**
 * Due-vs-completed counts for each of the last `count` days.
 * A completion is attributed only to the day it actually happened, so history
 * is not retroactively inflated by tasks finished today.
 */
export function buildTrend(todos: Todo[], count = 7) {
  const keys = lastDateKeys(count);
  return keys.map((key) => {
    let due = 0;
    let done = 0;
    let expired = 0;
    for (const todo of todos) {
      if (!isDueInRange(todo, key)) continue;
      due += 1;
      if (todo.completedAt && toDateKey(todo.completedAt) === key) done += 1;
      if (todo.expired && todo.endDate === key) expired += 1;
    }
    return { key, due, done, expired };
  });
}

export function defaultDraft() {
  const today = toDateKey(new Date());
  return {
    text: '',
    priority: 'medium' as Priority,
    startDate: today,
    endDate: today,
  };
}

export function daysUntil(todo: Todo): number {
  return Math.ceil((endOfDateKey(todo.endDate) - Date.now()) / DAY_MS);
}
