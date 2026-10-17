import { useCallback, useEffect, useState } from 'react';
import { SETTINGS_KEYS, settingsService } from '../../db/trackerService';
import { uid } from '../../utils/format';
import type { AddictionChallenge, AddictionSettings, ChallengeDifficulty, ChallengeTimeUnit } from '../../types';
import { getChallengeOption } from './addictionModel';

const DEFAULT_SETTINGS: AddictionSettings = {
  challenge: null,
  displayUnit: 'normal',
};

const TIME_UNITS: ChallengeTimeUnit[] = ['seconds', 'minutes', 'normal', 'hours'];

function normalizeSettings(value: Partial<AddictionSettings> | null | undefined): AddictionSettings {
  const unit = TIME_UNITS.includes(value?.displayUnit as ChallengeTimeUnit)
    ? value?.displayUnit as ChallengeTimeUnit
    : 'normal';
  const raw = value?.challenge as AddictionChallenge | null | undefined;
  if (!raw || typeof raw !== 'object') return { challenge: null, displayUnit: unit };

  const option = getChallengeOption(raw.difficulty);
  if (
    !['easy', 'medium', 'hard'].includes(raw.difficulty)
    || raw.durationDays !== option.durationDays
    || typeof raw.name !== 'string'
    || !raw.name.trim()
    || !Number.isFinite(raw.startTs)
  ) {
    return { challenge: null, displayUnit: unit };
  }

  return {
    displayUnit: unit,
    challenge: {
      id: typeof raw.id === 'string' ? raw.id : uid(),
      name: raw.name.trim(),
      difficulty: raw.difficulty,
      durationDays: option.durationDays,
      startTs: raw.startTs,
    },
  };
}

export function useAddictionTracker() {
  const [settings, setSettings] = useState<AddictionSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    settingsService.get<AddictionSettings>(SETTINGS_KEYS.addiction, DEFAULT_SETTINGS)
      .then((stored) => {
        if (active) setSettings(normalizeSettings(stored));
      })
      .catch((error) => console.warn('[challenge] could not load local challenge', error))
      .finally(() => {
        if (active) setSettingsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!settings.challenge) return;
    const refreshClock = () => setNow(Date.now());
    const timer = window.setInterval(refreshClock, 1_000);
    window.addEventListener('focus', refreshClock);
    document.addEventListener('visibilitychange', refreshClock);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshClock);
      document.removeEventListener('visibilitychange', refreshClock);
    };
  }, [settings.challenge]);

  const persistSettings = useCallback(async (next: AddictionSettings) => {
    await settingsService.set(SETTINGS_KEYS.addiction, next);
    setSettings(next);
  }, []);

  const startChallenge = useCallback(async (difficulty: ChallengeDifficulty, name: string) => {
    const option = getChallengeOption(difficulty);
    const startTs = Date.now();
    setNow(startTs);
    const challenge: AddictionChallenge = {
      id: uid(),
      name: name.trim(),
      difficulty: option.id,
      durationDays: option.durationDays,
      startTs,
    };
    await persistSettings({ ...settings, challenge });
    return challenge;
  }, [persistSettings, settings]);

  const setDisplayUnit = useCallback(async (displayUnit: ChallengeTimeUnit) => {
    await persistSettings({ ...settings, displayUnit });
  }, [persistSettings, settings]);

  const resetChallenge = useCallback(async () => {
    await persistSettings({ ...settings, challenge: null, displayUnit: 'normal' });
  }, [persistSettings, settings]);

  return {
    challenge: settings.challenge,
    displayUnit: settings.displayUnit,
    settingsLoaded,
    now,
    startChallenge,
    setDisplayUnit,
    resetChallenge,
  };
}
