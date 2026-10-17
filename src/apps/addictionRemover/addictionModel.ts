import type { RecoveryMode } from '../../types';

export interface PresetAddiction {
  id: string;
  name: string;
  category: string;
  emoji: string;
  /** A clinician should help plan changes because stopping can carry extra risk. */
  needsMedicalSupport?: boolean;
}

export const PRESET_ADDICTIONS: PresetAddiction[] = [
  { id: 'nicotine', name: 'Nicotine / vaping', category: 'Substance', emoji: '🚭' },
  { id: 'alcohol', name: 'Alcohol', category: 'Substance', emoji: '🍺', needsMedicalSupport: true },
  { id: 'sedatives', name: 'Benzodiazepines / sedatives', category: 'Substance', emoji: '💊', needsMedicalSupport: true },
  { id: 'opioids', name: 'Opioids / pain medicines', category: 'Substance', emoji: '🩺', needsMedicalSupport: true },
  { id: 'stimulants', name: 'Stimulants / other drugs', category: 'Substance', emoji: '🧪', needsMedicalSupport: true },
  { id: 'cannabis', name: 'Cannabis', category: 'Substance', emoji: '🌿' },
  { id: 'gambling', name: 'Gambling / betting', category: 'Behaviour', emoji: '🎲' },
  { id: 'digital', name: 'Gaming / social media', category: 'Digital', emoji: '📱' },
  { id: 'shopping', name: 'Compulsive shopping', category: 'Behaviour', emoji: '🛍️' },
  { id: 'other', name: 'Something else', category: 'Personal', emoji: '✳️' },
];

export const RECOVERY_MODES: {
  id: RecoveryMode;
  title: string;
  description: string;
}[] = [
  {
    id: 'quit',
    title: 'Stop',
    description: 'Work toward stopping, with medical advice first if withdrawal could be a risk.',
  },
  {
    id: 'reduce',
    title: 'Reduce',
    description: 'Choose a realistic change. Get professional guidance for substances or medicines.',
  },
  {
    id: 'explore',
    title: 'Explore',
    description: 'Notice patterns and try one supportive step while you decide what you want.',
  },
];

export const RECOVERY_REASONS = [
  'Protect my health',
  'Be more present with people I care about',
  'Feel more in control of my time',
  'Reduce stress and feel steadier',
  'Save money',
  'Make space for goals that matter to me',
];

export const COMMON_TRIGGERS = [
  'Stress or strong emotions',
  'Boredom or being alone',
  'A certain time or place',
  'People or social settings',
  'Pain, tiredness or poor sleep',
  'Easy access or reminders',
  'Celebrations or weekends',
];

export const COPING_ACTIONS = [
  'Move away from the cue and go somewhere safer',
  'Pause and delay the next decision for 10 minutes',
  'Slow my breathing and notice what is around me',
  'Message or call someone I trust',
  'Go for a short walk or do something with my hands',
  'Block access or remove a reminder, if it is safe to do so',
];

export const DAILY_STEPS = [
  'Make the next choice a little easier: put distance between you and one trigger.',
  'Send one honest message to someone who wants to support you.',
  'Take a short pause before acting on an urge; you only need to choose the next step.',
  'Notice one situation that made today easier or harder. No judgment—just information.',
  'Plan one activity that gives your time or attention somewhere else to go.',
  'If today feels difficult, ask for help sooner rather than handling it alone.',
  'Give yourself credit for showing up. Recovery is built from many small decisions.',
];

export interface RecoveryPlanDraft {
  presetId: string;
  name: string;
  category: string;
  mode: RecoveryMode;
  planText: string;
  reasons: string[];
  triggers: string[];
  copingActions: string[];
  supportName: string;
  supportPhone: string;
}

export function isHigherRiskTarget(presetId?: string): boolean {
  return PRESET_ADDICTIONS.some((preset) => preset.id === presetId && preset.needsMedicalSupport);
}

export function getTargetSafetyNote(presetId?: string): string | null {
  switch (presetId) {
    case 'alcohol':
    case 'sedatives':
      return 'Stopping alcohol or benzodiazepines/some sedatives suddenly can cause dangerous withdrawal. Do not detox alone or change a prescription on your own. Contact a qualified clinician or addiction service before making a change.';
    case 'opioids':
      return 'Please involve a healthcare professional in your plan and ask about overdose prevention. After a break, tolerance can fall; returning to a previous amount of an opioid can be dangerous.';
    case 'stimulants':
      return 'A clinician can help plan a safer next step and support sleep or mood changes. Seek urgent help if you feel unsafe or have thoughts of harming yourself.';
    default:
      return null;
  }
}

export function getGoalQuestion(mode: RecoveryMode | undefined, targetName: string): string {
  if (mode === 'reduce') return 'Did you follow the change you planned for today?';
  if (mode === 'explore') return 'Did you take one small step toward the change you want?';
  return `Were you able to avoid ${targetName} today?`;
}

/** Calendar-day count; calculating with UTC calendar dates avoids DST jumps. */
export function getJourneyDay(startTs: number, nowTs = Date.now()): number {
  const start = new Date(startTs);
  const now = new Date(nowTs);
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.floor((today - startDay) / 86_400_000) + 1);
}

export function formatCheckInOutcome(
  goalMet: boolean | null | undefined,
  mode: RecoveryMode | undefined,
): string {
  if (goalMet === null || goalMet === undefined) return 'Skipped';
  if (mode === 'explore') return goalMet ? 'Took a step' : 'No step today';
  return goalMet ? 'Plan followed' : mode === 'reduce' ? 'Plan was hard today' : 'Target happened';
}
