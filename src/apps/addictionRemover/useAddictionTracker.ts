import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettings, useCollection } from '../../hooks/useTracker';
import { writeRecord, deleteRecord, clearStore } from '../../db/indexedDB';
import { SETTINGS_KEYS, STORE_ADDICTION_CHECKINS } from '../../db/trackerService';
import { toDateKey } from '../../utils/date';
import { uid } from '../../utils/format';
import type { AddictionSettings, AddictionGoal, AddictionCheckIn } from '../../types';
import {
  CHALLENGE_PHASES,
  MILESTONE_BADGES,
  getDailyMotivation,
  type PhaseInfo,
  type DailyMotivation,
} from './addictionModel';

const DEFAULT_ADDICTION_SETTINGS: AddictionSettings = {
  activeGoal: null,
  history: [],
  enableUrgeSOS: true,
  dailyReminder: true,
};

export function useAddictionTracker() {
  const {
    settings,
    update,
    setSettings,
    loaded: settingsLoaded,
  } = useSettings<AddictionSettings>(
    SETTINGS_KEYS.addiction,
    DEFAULT_ADDICTION_SETTINGS,
  );

  const checkIns = useCollection<AddictionCheckIn>(
    STORE_ADDICTION_CHECKINS as any,
    async (input) => {
      const ts = input.ts ?? Date.now();
      const entry: AddictionCheckIn = {
        id: uid(),
        ts,
        dateKey: toDateKey(ts),
        dayNumber: (input as any).dayNumber ?? 1,
        mood: (input as any).mood ?? 'great',
        note: (input as any).note,
        cravingsResisted: (input as any).cravingsResisted ?? 0,
      };
      await writeRecord(STORE_ADDICTION_CHECKINS, entry as any);
      return entry;
    },
    async (id) => {
      await deleteRecord(STORE_ADDICTION_CHECKINS, id);
    },
    async () => {
      await clearStore(STORE_ADDICTION_CHECKINS);
    },
  );

  // Real-time ticking clock for smooth live second-by-second updates
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!settings.activeGoal?.active) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [settings.activeGoal?.active]);

  const activeGoal = settings.activeGoal;

  const elapsedStats = useMemo(() => {
    if (!activeGoal || !activeGoal.active) {
      return {
        elapsedMs: 0,
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        currentDay: 1,
        progressPct: 0,
      };
    }

    const elapsedMs = Math.max(0, now - activeGoal.startTs);
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const targetMs = activeGoal.targetDays * 86400 * 1000;
    const progressPct = targetMs > 0 ? Math.min(100, Math.round((elapsedMs / targetMs) * 100)) : 0;

    return {
      elapsedMs,
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      currentDay: days + 1,
      progressPct,
    };
  }, [activeGoal, now]);

  const currentPhase = useMemo<PhaseInfo>(() => {
    const day = elapsedStats.currentDay;
    if (day <= 7) return CHALLENGE_PHASES[0];
    if (day <= 14) return CHALLENGE_PHASES[1];
    return CHALLENGE_PHASES[2];
  }, [elapsedStats.currentDay]);

  const phaseProgressPct = useMemo(() => {
    const day = elapsedStats.currentDay;
    if (day > 21) return 100;
    const start = currentPhase.startDay;
    const end = currentPhase.endDay;
    const span = end - start + 1;
    const daysInPhase = Math.max(0, Math.min(span, day - start + 1));
    return Math.round((daysInPhase / span) * 100);
  }, [elapsedStats.currentDay, currentPhase]);

  const motivation = useMemo<DailyMotivation>(() => {
    return getDailyMotivation(elapsedStats.currentDay);
  }, [elapsedStats.currentDay]);

  const badges = useMemo(() => {
    const daysClean = elapsedStats.days;
    return MILESTONE_BADGES.map((b) => ({
      ...b,
      unlocked: daysClean >= b.daysRequired,
    }));
  }, [elapsedStats.days]);

  const unlockedCount = useMemo(() => badges.filter((b) => b.unlocked).length, [badges]);

  const todayKey = toDateKey(now);
  const todayCheckIn = useMemo(() => {
    return checkIns.items.find((c) => c.dateKey === todayKey);
  }, [checkIns.items, todayKey]);

  // Actions
  const startChallenge = useCallback(
    (name: string, category: string, reasons: string[], customStartTs?: number) => {
      const startTs = customStartTs ?? Date.now();
      const newGoal: AddictionGoal = {
        id: uid(),
        name: name.trim(),
        category,
        startTs,
        targetDays: 21,
        reasons,
        active: true,
        relapses: 0,
      };

      setSettings({
        ...settings,
        activeGoal: newGoal,
      });
      return newGoal;
    },
    [setSettings, settings],
  );

  const relapseAndRestart = useCallback(
    (notes?: string) => {
      if (!activeGoal) return;
      const finishedGoal: AddictionGoal = {
        ...activeGoal,
        active: false,
        reasons: notes ? [...activeGoal.reasons, `Trigger noted: ${notes}`] : activeGoal.reasons,
        relapses: activeGoal.relapses + 1,
      };

      const newGoal: AddictionGoal = {
        ...activeGoal,
        id: uid(),
        startTs: Date.now(),
        relapses: activeGoal.relapses + 1,
        active: true,
      };

      setSettings({
        ...settings,
        activeGoal: newGoal,
        history: [finishedGoal, ...(settings.history ?? [])],
      });
    },
    [activeGoal, setSettings, settings],
  );

  const logDailyCheckIn = useCallback(
    async (mood: 'great' | 'good' | 'neutral' | 'struggling', note?: string, cravingsResisted = 0) => {
      return checkIns.add({
        ts: Date.now(),
        dayNumber: elapsedStats.currentDay,
        mood,
        note,
        cravingsResisted,
      } as any);
    },
    [checkIns, elapsedStats.currentDay],
  );

  const updateGoal = useCallback(
    (patch: Partial<AddictionGoal>) => {
      if (!activeGoal) return;
      const updated = { ...activeGoal, ...patch };
      setSettings({
        ...settings,
        activeGoal: updated,
      });
    },
    [activeGoal, setSettings, settings],
  );

  const resetAllData = useCallback(async () => {
    await checkIns.clear();
    setSettings(DEFAULT_ADDICTION_SETTINGS);
  }, [checkIns, setSettings]);

  return {
    settings,
    activeGoal,
    settingsLoaded,
    elapsedStats,
    currentPhase,
    phaseProgressPct,
    motivation,
    badges,
    unlockedCount,
    todayCheckIn,
    checkIns: checkIns.items,
    checkInsLoading: checkIns.loading,
    startChallenge,
    relapseAndRestart,
    logDailyCheckIn,
    updateGoal,
    resetAllData,
    update,
  };
}
