import { useCallback, useMemo } from 'react';
import { waterLogs, waterService } from '../../db/trackerService';
import { useCollection, useSettings, useWindow } from '../../hooks/useTracker';
import type { WaterLog, WaterSettings } from '../../types';
import { DEFAULT_WATER, SETTINGS_KEYS } from '../../db/trackerService';
import { endOfDay, lastDateKeys, startOfDay, toDateKey } from '../../utils/date';

/** Aggregated water state: settings + logs + derived daily/weekly metrics. */
export function useWaterTracker() {
  const { settings, update, setSettings, reset, loaded } = useSettings<WaterSettings>(
    SETTINGS_KEYS.water,
    DEFAULT_WATER,
  );

  const collection = useCollection<WaterLog>(
    'waterLogs',
    (input) => waterLogs.add(input),
    (id) => waterLogs.remove(id),
    () => waterLogs.clear(),
  );

  const { start, end } = useMemo(() => {
    const now = Date.now();
    if (settings.resetSchedule === '4am') {
      const fourHoursMs = 4 * 3600 * 1000;
      const baseStart = startOfDay(now - fourHoursMs) + fourHoursMs;
      return { start: baseStart, end: baseStart + 86400000 - 1 };
    }
    if (settings.resetSchedule === 'manual') {
      const manualBase = settings.manualResetTs ? Math.min(now, settings.manualResetTs) : startOfDay(now);
      return { start: manualBase, end: endOfDay(now) };
    }
    return { start: startOfDay(now), end: endOfDay(now) };
  }, [settings.resetSchedule, settings.manualResetTs]);

  const today = useWindow<WaterLog>(collection.items, start, end);

  const todayMl = useMemo(() => today.reduce((sum, row) => sum + row.amountMl, 0), [today]);

  const week = useMemo(() => {
    const keys = lastDateKeys(7);
    return keys.map((key) => {
      const total = collection.items
        .filter((row) => row.dateKey === key)
        .reduce((sum, row) => sum + row.amountMl, 0);
      return { key, label: key.slice(8), total };
    });
  }, [collection.items]);

  /**
   * Consecutive days (ending today) where the goal was met.
   * Today is allowed to still be "pending" without breaking the run, but any
   * fully-missed past day stops the count.
   */
  const streak = useMemo(() => {
    const today = toDateKey(new Date());
    const keys = lastDateKeys(60).reverse(); // newest first
    const totalsByDay = new Map<string, number>();
    for (const row of collection.items) {
      totalsByDay.set(row.dateKey, (totalsByDay.get(row.dateKey) ?? 0) + row.amountMl);
    }

    let count = 0;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const total = totalsByDay.get(key) ?? 0;
      if (total >= settings.dailyTargetMl) {
        count += 1;
        continue;
      }
      // Today isn't finished yet — an unmet today must not erase yesterday's run.
      if (key === today && count >= 0) continue;
      break;
    }
    return count;
  }, [collection.items, settings.dailyTargetMl]);

  const addWater = useCallback(
    async (amountMl: number, container?: string) => {
      const safe = Math.max(1, Math.min(5000, Math.round(amountMl)));
      const entry = await collection.add({ amountMl: safe, container });
      return entry;
    },
    [collection],
  );

  const undoLast = useCallback(async () => {
    const [first] = collection.items;
    if (!first) return null;
    await collection.remove(first.id);
    return first;
  }, [collection]);

  const triggerManualReset = useCallback(() => {
    update({ manualResetTs: Date.now() });
  }, [update]);

  return {
    settings,
    update,
    setSettings,
    reset,
    loaded,
    logs: collection.items,
    loading: collection.loading,
    today,
    todayMl,
    week,
    streak,
    addWater,
    removeLog: collection.remove,
    clearLogs: collection.clear,
    undoLast,
    triggerManualReset,
    saveSettings: waterService.saveSettings,
  };
}

export type WaterState = ReturnType<typeof useWaterTracker>;
