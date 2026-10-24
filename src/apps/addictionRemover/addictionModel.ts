import type {
  AddictionChallenge,
  ChallengeDifficulty,
  ChallengeDurationDays,
  ChallengeTimeUnit,
} from '../../types';

export interface ChallengeOption {
  id: ChallengeDifficulty;
  title: string;
  durationDays: ChallengeDurationDays;
  description: string;
  emoji: string;
}

export const CHALLENGE_OPTIONS: ChallengeOption[] = [
  {
    id: 'easy',
    title: 'Easy',
    durationDays: 7,
    description: 'A gentle one-week start',
    emoji: '🌱',
  },
  {
    id: 'medium',
    title: 'Medium',
    durationDays: 14,
    description: 'Build momentum over two weeks',
    emoji: '🌿',
  },
  {
    id: 'hard',
    title: 'Hard',
    durationDays: 22,
    description: 'A focused 22-day commitment',
    emoji: '🔥',
  },
];

export const COUNTDOWN_OPTIONS: { id: ChallengeTimeUnit; label: string }[] = [
  { id: 'seconds', label: 'Seconds' },
  { id: 'minutes', label: 'Minutes' },
  { id: 'normal', label: 'Standard' },
  { id: 'hours', label: 'Hours' },
];

export const DAILY_MESSAGES = [
  'Starting is already a meaningful step.',
  'Focus on the next small decision.',
  'If it feels difficult, pause, hydrate, and reach out to someone you trust.',
  'Create a little distance today from a situation that may trigger an urge.',
  'Remember why you chose to make this change.',
  'You do not need to finish the whole journey today. Focus on today.',
  'The first week is complete. Take a moment to recognize your effort.',
  'A new week brings another chance to use what you have learned.',
  'Notice when urges tend to appear. Awareness is progress.',
  'Asking for support is a brave step.',
  'Make the next step smaller. Start with the next ten minutes.',
  'Choose one safe alternative you can turn to today.',
  'Progress is not always a straight line. You can begin again.',
  'You have kept going through two weeks. That effort matters.',
  'Move one tempting cue out of your surroundings today.',
  'Tell someone you trust about the goal you are working toward.',
  'Difficult feelings can pass. It is okay to ask for help.',
  'Be kind to yourself and choose the next helpful action.',
  'If your plan is not working, you are allowed to adjust it.',
  'Make rest and a safe environment part of your plan.',
  'Trying for one more day is worthwhile.',
  'On the final day, keep giving your wellbeing the attention it deserves.',
] as const;

export function getChallengeDay(challenge: AddictionChallenge, nowTs = Date.now()): number {
  const elapsedDays = Math.max(0, Math.floor((nowTs - challenge.startTs) / 86_400_000));
  return Math.min(challenge.durationDays, elapsedDays + 1);
}

export function getRemainingMs(challenge: AddictionChallenge, nowTs = Date.now()): number {
  const deadline = challenge.startTs + challenge.durationDays * 86_400_000;
  return Math.max(0, deadline - nowTs);
}

export function getCountdownValue(
  challenge: AddictionChallenge,
  unit: Exclude<ChallengeTimeUnit, 'normal'>,
  nowTs = Date.now(),
): number {
  const remainingMs = getRemainingMs(challenge, nowTs);
  const divisor = unit === 'seconds' ? 1_000 : unit === 'minutes' ? 60_000 : 3_600_000;
  return Math.ceil(remainingMs / divisor);
}

export function getNormalCountdown(challenge: AddictionChallenge, nowTs = Date.now()) {
  const totalSeconds = Math.ceil(getRemainingMs(challenge, nowTs) / 1_000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function getDailyMessage(day: number, durationDays: number): string {
  const safeDay = Math.max(1, Math.min(Math.floor(day), durationDays, DAILY_MESSAGES.length));
  return DAILY_MESSAGES[safeDay - 1] ?? DAILY_MESSAGES[0];
}

export function getChallengeOption(difficulty: ChallengeDifficulty): ChallengeOption {
  return CHALLENGE_OPTIONS.find((option) => option.id === difficulty) ?? CHALLENGE_OPTIONS[0];
}
