import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearStore, readAll, writeRecord } from '../../db/indexedDB';
import {
  DEFAULT_ADDICTION,
  SETTINGS_KEYS,
  STORE_ADDICTION_CHECKINS,
  settingsService,
} from '../../db/trackerService';
import { toDateKey } from '../../utils/date';
import { uid } from '../../utils/format';
import type { AddictionCheckIn, AddictionGoal, AddictionSettings, RecoveryMode } from '../../types';
import { getJourneyDay, type RecoveryPlanDraft } from './addictionModel';

const DEFAULT_SETTINGS: AddictionSettings = {
  ...(DEFAULT_ADDICTION as AddictionSettings),
  activeGoal: null,
  history: [],
};

export interface DailyCheckInDraft {
  mood: AddictionCheckIn['mood'];
  cravingLevel: number;
  goalMet: boolean | null;
  note?: string;
}

function normalizeGoal(goal: AddictionGoal | null | undefined): AddictionGoal | null {
  if (!goal || typeof goal !== 'object') return null;
  const mode = ['quit', 'reduce', 'explore'].includes(String(goal.mode))
    ? goal.mode as RecoveryMode
    : 'quit';
  return {
    ...goal,
    mode,
    active: goal.active !== false,
    reasons: Array.isArray(goal.reasons) ? goal.reasons.filter((item) => typeof item === 'string') : [],
    triggers: Array.isArray(goal.triggers) ? goal.triggers.filter((item) => typeof item === 'string') : [],
    copingActions: Array.isArray(goal.copingActions) ? goal.copingActions.filter((item) => typeof item === 'string') : [],
    planText: typeof goal.planText === 'string' ? goal.planText : '',
    supportName: typeof goal.supportName === 'string' ? goal.supportName : '',
    supportPhone: typeof goal.supportPhone === 'string' ? goal.supportPhone : '',
    relapses: Number.isFinite(goal.relapses) ? goal.relapses : 0,
  };
}

function normalizeSettings(value: AddictionSettings): AddictionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    activeGoal: normalizeGoal(value?.activeGoal),
    history: Array.isArray(value?.history) ? value.history : [],
  };
}

export function useAddictionTracker() {
  const [settings, setSettings] = useState<AddictionSettings>(DEFAULT_SETTINGS);
  const [checkIns, setCheckIns] = useState<AddictionCheckIn[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    Promise.all([
      settingsService.get<AddictionSettings>(SETTINGS_KEYS.addiction, DEFAULT_SETTINGS),
      readAll<AddictionCheckIn>(STORE_ADDICTION_CHECKINS),
    ])
      .then(([storedSettings, storedCheckIns]) => {
        if (!active) return;
        setSettings(normalizeSettings(storedSettings));
        setCheckIns(storedCheckIns.sort((a, b) => b.ts - a.ts));
      })
      .catch((error) => console.warn('[recovery] could not load local plan', error))
      .finally(() => {
        if (active) setSettingsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeGoal = settings.activeGoal?.active ? settings.activeGoal : null;
  const todayKey = toDateKey(now);
  const currentCheckIns = useMemo(
    () => checkIns.filter((item) => !activeGoal || !item.goalId || item.goalId === activeGoal.id),
    [activeGoal, checkIns],
  );
  const todayCheckIn = useMemo(
    () => currentCheckIns.find((item) => item.dateKey === todayKey),
    [currentCheckIns, todayKey],
  );
  const journeyDay = activeGoal ? getJourneyDay(activeGoal.startTs, now) : 1;

  const persistSettings = useCallback(async (next: AddictionSettings) => {
    setSettings(next);
    await settingsService.set(SETTINGS_KEYS.addiction, next);
  }, []);

  const startPlan = useCallback(async (draft: RecoveryPlanDraft) => {
    const startTs = Date.now();
    const goal: AddictionGoal = {
      id: uid(),
      name: draft.name.trim(),
      category: draft.category,
      presetId: draft.presetId,
      startTs,
      mode: draft.mode,
      planText: draft.planText.trim(),
      reasons: draft.reasons,
      triggers: draft.triggers,
      copingActions: draft.copingActions,
      supportName: draft.supportName.trim(),
      supportPhone: draft.supportPhone.trim(),
      active: true,
      relapses: 0,
    };
    const next = { ...settings, activeGoal: goal };
    await persistSettings(next);
    return goal;
  }, [persistSettings, settings]);

  const updateGoal = useCallback(async (patch: Partial<AddictionGoal>) => {
    if (!settings.activeGoal) return;
    const next = {
      ...settings,
      activeGoal: { ...settings.activeGoal, ...patch },
    };
    await persistSettings(next);
  }, [persistSettings, settings]);

  const saveDailyCheckIn = useCallback(async (draft: DailyCheckInDraft) => {
    if (!activeGoal) return;
    const ts = Date.now();
    const dateKey = toDateKey(ts);
    const previous = checkIns.find((item) =>
      item.dateKey === dateKey && (item.goalId === activeGoal.id || !item.goalId),
    );
    const entry: AddictionCheckIn = {
      id: previous?.id ?? uid(),
      ts,
      dateKey,
      dayNumber: getJourneyDay(activeGoal.startTs, ts),
      goalId: activeGoal.id,
      mode: activeGoal.mode ?? 'quit',
      mood: draft.mood,
      cravingLevel: Math.max(0, Math.min(10, Math.round(draft.cravingLevel))),
      goalMet: draft.goalMet,
      note: draft.note?.trim() || undefined,
    };

    await writeRecord(STORE_ADDICTION_CHECKINS, entry as unknown as { id: string });
    setCheckIns((previousEntries) => [
      entry,
      ...previousEntries.filter((item) => item.id !== entry.id),
    ].sort((a, b) => b.ts - a.ts));

    return entry;
  }, [activeGoal, checkIns]);

  const resetAllData = useCallback(async () => {
    await clearStore(STORE_ADDICTION_CHECKINS);
    await persistSettings(DEFAULT_SETTINGS);
    setCheckIns([]);
  }, [persistSettings]);

  return {
    settings,
    activeGoal,
    settingsLoaded,
    checkIns: currentCheckIns,
    todayCheckIn,
    journeyDay,
    startPlan,
    updateGoal,
    saveDailyCheckIn,
    resetAllData,
  };
}
