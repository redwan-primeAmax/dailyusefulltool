/** Date helpers shared by every tracker (all local-time based, mutation-free). */

export const DAY_MS = 86_400_000;

/** Parses a `YYYY-MM-DD` key into a fresh local Date at midnight. */
export function fromKey(key: string): Date {
  const [y = 1970, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Midnight timestamp for the supplied date.
 * Always copies first — callers routinely pass Date objects they still hold,
 * and mutating them silently corrupts clocks and streak maths.
 */
export function startOfDay(date: Date | number = new Date()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(date: Date | number = new Date()): number {
  return startOfDay(date) + DAY_MS - 1;
}

/** Monday-first week start. */
export function startOfWeek(date: Date | number = new Date()): number {
  const d = new Date(startOfDay(date));
  const offset = (d.getDay() + 6) % 7;
  return d.getTime() - offset * DAY_MS;
}

export function startOfMonth(date: Date | number = new Date()): number {
  const d = new Date(startOfDay(date));
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/** First millisecond of the month after the one containing `date`. */
export function startOfNextMonth(date: Date | number = new Date()): number {
  const d = new Date(startOfDay(date));
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

export function endOfMonth(date: Date | number = new Date()): number {
  return startOfNextMonth(date) - 1;
}

export type BudgetPeriodName = 'daily' | 'weekly' | 'monthly';

/**
 * Inclusive [start, end] window for a budget period.
 * Monthly uses real calendar bounds rather than a fixed 32-day guess, which
 * previously spilled into the following month.
 */
export function periodBounds(period: BudgetPeriodName, now = Date.now()) {
  if (period === 'daily') {
    return { start: startOfDay(now), end: endOfDay(now) };
  }
  if (period === 'weekly') {
    return { start: startOfWeek(now), end: startOfWeek(now) + 7 * DAY_MS - 1 };
  }
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

/**
 * Shifts a `YYYY-MM-DD` key by whole calendar days.
 * Uses Date arithmetic rather than millisecond offsets so daylight-saving
 * transitions can never duplicate or skip a day in rolling windows.
 */
export function addDaysToKey(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/**
 * Inclusive list of the last `count` date keys, oldest → newest.
 * Anchored on the calendar, so DST-safe.
 */
export function lastDateKeys(count: number, now = Date.now()): string[] {
  const safeCount = Math.max(1, Math.floor(count));
  const today = toDateKey(new Date(startOfDay(now)));
  return Array.from({ length: safeCount }, (_, i) => addDaysToKey(today, i - (safeCount - 1)));
}

/** Yesterday's date key. */
export function yesterdayKey(now = Date.now()): string {
  return addDaysToKey(toDateKey(new Date(startOfDay(now))), -1);
}

export function dayLabel(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = Math.round((now - ts) / 1000);
  if (diff < 0) return 'just now';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172_800) return 'yesterday';
  return `${Math.floor(diff / 86_400)}d ago`;
}

export function formatClock(date: Date, use24h: boolean): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24h,
  });
}

/** `7:30` / `19:30` style label for a minute offset within a day. */
export function minutesToClock(total: number, use24h = false): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(total)));
  const h24 = Math.floor(clamped / 60);
  const min = clamped % 60;
  if (use24h) return `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  const h = h24 % 12 || 12;
  return `${h}:${String(min).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** Converts `HH:MM` (24h) into minutes past midnight. Returns NaN if invalid. */
export function clockToMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return Number.NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return Number.NaN;
  return h * 60 + m;
}
