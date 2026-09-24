import { useCallback, useMemo } from 'react';
import { DEFAULT_STUDY, SETTINGS_KEYS, studySessions } from '../../db/trackerService';
import { useCollection, useSettings, useWindow } from '../../hooks/useTracker';
import type { StudySession, StudySettings, StudySubject } from '../../types';
import { endOfDay, lastDateKeys, periodBounds, startOfDay, startOfWeek } from '../../utils/date';

/** Study state: goals, subjects, sessions and derived daily/weekly metrics. */
export function useStudyTracker() {
  const { settings, update, setSettings, reset, loaded } = useSettings<StudySettings>(
    SETTINGS_KEYS.study,
    DEFAULT_STUDY,
  );

  const collection = useCollection<StudySession>(
    'studySessions',
    (input) => studySessions.add(input),
    (id) => studySessions.remove(id),
    () => studySessions.clear(),
  );

  const windows = useMemo(
    () => ({
      day: { start: startOfDay(), end: endOfDay() },
      week: { start: startOfWeek(), end: endOfDay() },
    }),
    [],
  );

  const todaySessions = useWindow<StudySession>(
    collection.items,
    windows.day.start,
    windows.day.end,
  );
  const weekSessions = useWindow<StudySession>(
    collection.items,
    windows.week.start,
    windows.week.end,
  );

  const sum = (rows: StudySession[]) => rows.reduce((total, row) => total + row.minutes, 0);

  const todayMinutes = useMemo(() => sum(todaySessions), [todaySessions]);
  const weekMinutes = useMemo(() => sum(weekSessions), [weekSessions]);

  const week = useMemo(() => {
    const keys = lastDateKeys(7);
    return keys.map((key) => ({
      key,
      minutes: collection.items
        .filter((row) => row.dateKey === key)
        .reduce((total, row) => total + row.minutes, 0),
    }));
  }, [collection.items]);

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    weekSessions.forEach((row) => map.set(row.subjectId, (map.get(row.subjectId) ?? 0) + row.minutes));
    return Array.from(map.entries())
      .map(([subjectId, minutes]) => ({
        subjectId,
        minutes,
        subject: settings.subjects.find((s) => s.id === subjectId),
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [weekSessions, settings.subjects]);

  const subjectName = useCallback(
    (id: string) => settings.subjects.find((s) => s.id === id)?.name ?? 'General',
    [settings.subjects],
  );
  const subjectColor = useCallback(
    (id: string) => settings.subjects.find((s) => s.id === id)?.color ?? '#64748b',
    [settings.subjects],
  );

  const addSession = useCallback(
    async (input: { minutes: number; subjectId: string; note?: string; source: 'timer' | 'quick' }) => {
      const minutes = Math.max(1, Math.min(600, Math.round(input.minutes)));
      return collection.add({ ...input, minutes });
    },
    [collection],
  );

  const addSubject = useCallback(
    (name: string, color: string) => {
      const subject: StudySubject = { id: `s${Date.now().toString(36)}`, name, color };
      setSettings({ ...settings, subjects: [...settings.subjects, subject] });
      return subject;
    },
    [setSettings, settings],
  );

  const removeSubject = useCallback(
    (id: string) => setSettings({ ...settings, subjects: settings.subjects.filter((s) => s.id !== id) }),
    [setSettings, settings],
  );

  const renameSubject = useCallback(
    (id: string, name: string) =>
      setSettings({ ...settings, subjects: settings.subjects.map((s) => (s.id === id ? { ...s, name } : s)) }),
    [setSettings, settings],
  );

  const streak = useMemo(() => {
    const keys = lastDateKeys(45).reverse();
    const totals = new Map<string, number>(keys.map((k) => [k, 0]));
    collection.items.forEach((row) => {
      if (totals.has(row.dateKey)) totals.set(row.dateKey, (totals.get(row.dateKey) ?? 0) + row.minutes);
    });
    let count = 0;
    for (let i = keys.length - 1; i >= 0; i -= 1) {
      const total = totals.get(keys[i]) ?? 0;
      if (total >= 1) count += 1;
      else break;
    }
    return count;
  }, [collection.items]);

  const todayBySubject = useMemo(() => {
    const map = new Map<string, number>();
    todaySessions.forEach((row) => map.set(row.subjectId, (map.get(row.subjectId) ?? 0) + row.minutes));
    return Array.from(map.entries())
      .map(([subjectId, minutes]) => {
        const subject = settings.subjects.find((s) => s.id === subjectId) ?? {
          id: subjectId,
          name: 'General',
          color: '#64748b',
        };
        const pctOfGoal = settings.dailyGoalMin > 0 ? (minutes / settings.dailyGoalMin) * 100 : 0;
        const pctOfTotal = todayMinutes > 0 ? (minutes / todayMinutes) * 100 : 0;
        return {
          subjectId,
          minutes,
          subject,
          pctOfGoal,
          pctOfTotal,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }, [todaySessions, settings.subjects, settings.dailyGoalMin, todayMinutes]);

  const allPeriods = useMemo(() => periodBounds('daily'), []);

  return {
    settings,
    update,
    setSettings,
    reset,
    loaded,
    sessions: collection.items,
    loading: collection.loading,
    todaySessions,
    weekSessions,
    todayMinutes,
    weekMinutes,
    week,
    bySubject,
    todayBySubject,
    streak,
    windows,
    allPeriods,
    addSession,
    removeSession: collection.remove,
    clearSessions: collection.clear,
    addSubject,
    removeSubject,
    renameSubject,
    subjectName,
    subjectColor,
  };
}

export type StudyState = ReturnType<typeof useStudyTracker>;
