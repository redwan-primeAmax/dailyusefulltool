import { useCallback, useMemo } from 'react';
import { DEFAULT_EXPENSE, SETTINGS_KEYS, expenses as expenseStore } from '../../db/trackerService';
import { useCollection, useSettings, useWindow } from '../../hooks/useTracker';
import type {
  BudgetPeriod,
  ExpenseCategory,
  ExpenseEntry,
  ExpenseSettings,
} from '../../types';
import { lastDateKeys, periodBounds } from '../../utils/date';
import { percent } from '../../utils/format';

export type BudgetStatus = 'safe' | 'warning' | 'critical' | 'over';

export interface BudgetSnapshot {
  spent: number;
  limit: number;
  remaining: number;
  ratio: number;
  pct: number;
  status: BudgetStatus;
  daysLeft: number;
  dailyAllowance: number;
}

/** Expense limiter state: challenge settings, entries and budget maths. */
export function useExpenseTracker() {
  const { settings, update, setSettings, reset, loaded } = useSettings<ExpenseSettings>(
    SETTINGS_KEYS.expense,
    DEFAULT_EXPENSE,
  );

  const collection = useCollection<ExpenseEntry>(
    'expenses',
    (input) => expenseStore.add(input),
    (id) => expenseStore.remove(id),
    () => expenseStore.clear(),
  );

  const { start, end } = useMemo(() => {
    const bounds = periodBounds(settings.period);
    return { start: bounds.start, end: bounds.end };
  }, [settings.period]);

  const periodEntries = useWindow<ExpenseEntry>(collection.items, start, end);

  const spent = useMemo(
    () => periodEntries.reduce((total, row) => total + row.amount, 0),
    [periodEntries],
  );

  const daysLeft = useMemo(() => {
    const ms = end - Date.now();
    const days = Math.ceil(ms / 86_400_000);
    if (settings.period === 'daily') return Math.max(1, days);
    return Math.max(1, days);
  }, [end, settings.period]);

  const snapshot: BudgetSnapshot = useMemo(() => {
    const pct = percent(spent, settings.limit);
    const status: BudgetStatus =
      spent > settings.limit ? 'over' : pct >= 100 ? 'critical' : pct >= settings.warningThreshold ? 'warning' : 'safe';
    return {
      spent,
      limit: settings.limit,
      remaining: settings.limit - spent,
      ratio: spent / Math.max(1, settings.limit),
      pct,
      status,
      daysLeft,
      dailyAllowance: Math.max(0, (settings.limit - spent) / daysLeft),
    };
  }, [spent, settings.limit, settings.warningThreshold, daysLeft]);

  const week = useMemo(() => {
    const keys = lastDateKeys(7);
    return keys.map((key) => ({
      key,
      amount: collection.items.filter((row) => row.dateKey === key).reduce((s, r) => s + r.amount, 0),
    }));
  }, [collection.items]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    periodEntries.forEach((row) => {
      const prev = map.get(row.categoryId) ?? { amount: 0, count: 0 };
      map.set(row.categoryId, { amount: prev.amount + row.amount, count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([id, value]) => ({
        category: settings.categories.find((c) => c.id === id),
        ...value,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodEntries, settings.categories]);

  const category = useCallback(
    (id: string): ExpenseCategory =>
      settings.categories.find((c) => c.id === id) ?? {
        id: 'unknown',
        name: 'Other',
        emoji: '💸',
        color: '#64748b',
      },
    [settings.categories],
  );

  const addExpense = useCallback(
    async (input: { amount: number; categoryId: string; note?: string; ts?: number }) =>
      collection.add({ ...input, amount: Math.max(0.01, Math.round(input.amount * 100) / 100) }),
    [collection],
  );

  /**
   * Projected spend at the current burn rate, extrapolated across the whole
   * period. Uses the real elapsed fraction of the window rather than the
   * previous hard-coded 7/30-day guesses.
   */
  const projected = useMemo(() => {
    const total = end - start;
    if (total <= 0) return spent;
    const elapsedMs = Math.max(0, Math.min(total, Date.now() - start));
    if (elapsedMs === 0) return 0;
    return Math.round((spent / elapsedMs) * total);
  }, [spent, start, end]);

  const addCategory = useCallback(
    (name: string, emoji: string, color: string) => {
      const next: ExpenseCategory = { id: `c${Date.now().toString(36)}`, name, emoji, color };
      setSettings({ ...settings, categories: [...settings.categories, next] });
      return next;
    },
    [setSettings, settings],
  );

  const removeCategory = useCallback(
    (id: string) => setSettings({ ...settings, categories: settings.categories.filter((c) => c.id !== id) }),
    [setSettings, settings],
  );

  const setPeriod = (period: BudgetPeriod) => update({ period });

  return {
    settings,
    update,
    setSettings,
    reset,
    loaded,
    entries: collection.items,
    loading: collection.loading,
    periodEntries,
    spent,
    snapshot,
    week,
    byCategory,
    category,
    addExpense,
    removeEntry: collection.remove,
    clearEntries: collection.clear,
    addCategory,
    removeCategory,
    setPeriod,
    periodStart: start,
    periodEnd: end,
    projected,
  };
}

export type ExpenseState = ReturnType<typeof useExpenseTracker>;
