/**
 * Breathing technique library — six dedicated exercises.
 * Pure data + derived helpers. No React, no DOM.
 */

export type PhaseKind = 'inhale' | 'hold' | 'exhale';

export interface BreathPhase {
  kind: PhaseKind;
  /** Duration of this phase, in seconds. */
  seconds: number;
  /** Short label shown as the live cue. */
  label: string;
  /** Clear instruction for the on-screen guidance. */
  instruction: string;
  /** Ring scale target: grow on inhale, hold steady, shrink on exhale. */
  targetScale: number;
  /** Optional override hint (e.g. which nostril). */
  hint?: string;
}

export interface Technique {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** One-line tagline for the library card. */
  tagline: string;
  description: string;
  benefit: string;
  /** Secondary accent for gradient artwork. */
  color2: string;
  /** Whether to show the extra step-by-step guide rail. */
  guided?: boolean;
  phases: BreathPhase[];
}

const phase = (
  kind: PhaseKind,
  seconds: number,
  instruction: string,
  targetScale: number,
  hint?: string,
  label?: string,
): BreathPhase => ({
  kind,
  seconds,
  instruction,
  targetScale,
  hint,
  label: label ?? (kind === 'inhale' ? 'Breathe in' : kind === 'exhale' ? 'Breathe out' : 'Hold'),
});

/* ── 1. Box Breathing ──────────────────────────────────────────── */
const box: Technique = {
  id: 'box',
  name: 'Box Breathing',
  emoji: '🟦',
  color: '#14b8a6',
  color2: '#0ea5e9',
  tagline: '4 · 4 · 4 · 4',
  description: 'Equal-count breathing that steadies the nervous system, used by athletes and first responders.',
  benefit: 'Focus & stress control',
  phases: [
    phase('inhale', 4, 'Inhale slowly through your nose', 1.25),
    phase('hold', 4, 'Hold gently at the top', 1.25),
    phase('exhale', 4, 'Exhale slowly through your mouth', 0.72),
    phase('hold', 4, 'Rest empty before the next breath', 0.72),
  ],
};

/* ── 2. 4-7-8 Relaxation ───────────────────────────────────────── */
const fourSevenEight: Technique = {
  id: '478',
  name: '4-7-8 Relaxation',
  emoji: '😴',
  color: '#0ea5e9',
  color2: '#6366f1',
  tagline: '4 · 7 · 8',
  description: 'The classic Dr. Weil relaxation breath — a long hold and slow exhale to calm the body fast.',
  benefit: 'Calming & sleep-inducing',
  phases: [
    phase('inhale', 4, 'Inhale quietly through the nose', 1.25),
    phase('hold', 7, 'Hold the breath, keep shoulders soft', 1.25),
    phase('exhale', 8, 'Exhale fully through the mouth', 0.66),
  ],
};

/* ── 3. Alternate Nostril Breathing ────────────────────────────── */
const alternate: Technique = {
  id: 'alternate',
  name: 'Alternate Nostril',
  emoji: '🫁',
  color: '#22c55e',
  color2: '#14b8a6',
  tagline: 'Guided · balance',
  description: 'Nadi Shodhana — balances both halves of the brain and clears a foggy mind.',
  benefit: 'Balance & mental clarity',
  guided: true,
  phases: [
    phase('inhale', 4, 'Close your right nostril, inhale through the left', 1.25, 'Left nostril', 'Inhale left'),
    phase('hold', 2, 'Close both nostrils and hold', 1.25, 'Both closed', 'Hold'),
    phase('exhale', 4, 'Release the left, exhale through the right', 0.72, 'Right nostril', 'Exhale right'),
    phase('inhale', 4, 'Inhale through the right nostril', 1.25, 'Right nostril', 'Inhale right'),
    phase('hold', 2, 'Close both nostrils and hold', 1.25, 'Both closed', 'Hold'),
    phase('exhale', 4, 'Release the right, exhale through the left', 0.72, 'Left nostril', 'Exhale left'),
  ],
};

/* ── 4. Diaphragmatic / Belly Breathing ────────────────────────── */
const belly: Technique = {
  id: 'belly',
  name: 'Belly Breathing',
  emoji: '🫃',
  color: '#f59e0b',
  color2: '#f97316',
  tagline: '5 · 5',
  description: 'Slow diaphragmatic breathing that engages the belly and signals deep safety to the brain.',
  benefit: 'Grounding & relaxation',
  phases: [
    phase('inhale', 5, 'Let your belly rise as you inhale through the nose', 1.3),
    phase('exhale', 5, 'Deflate the belly as you exhale through the mouth', 0.68),
  ],
};

/* ── 5. 6-6 Paced Breathing ────────────────────────────────────── */
const paced6: Technique = {
  id: 'paced6',
  name: '6-6 Paced',
  emoji: '🧭',
  color: '#06b6d4',
  color2: '#0ea5e9',
  tagline: '6 · 6',
  description: 'A steady six-second inhale and exhale that synchronises heart and breath for calm focus.',
  benefit: 'Heart-rate coherence',
  phases: [
    phase('inhale', 6, 'Inhale evenly through the nose', 1.28),
    phase('exhale', 6, 'Exhale smoothly through the mouth', 0.7),
  ],
};

/* ── 6. Alertness Breath ───────────────────────────────────────── */
const alertness: Technique = {
  id: 'alertness',
  name: 'Alertness Breath',
  emoji: '⚡',
  color: '#f97316',
  color2: '#ef4444',
  tagline: 'Fast · 2 · 2',
  description: 'A quick, energising cycle that raises alertness and shakes off lethargy.',
  benefit: 'Energy & alertness',
  phases: [
    phase('inhale', 2, 'Quick, sharp inhale through the nose', 1.2),
    phase('exhale', 2, 'Brisk exhale through the mouth', 0.8),
  ],
};

export const TECHNIQUES: Technique[] = [
  box,
  fourSevenEight,
  alternate,
  belly,
  paced6,
  alertness,
];

/** Total elapsed time of one full cycle for a technique. */
export function cycleSeconds(technique: Technique): number {
  return technique.phases.reduce((sum, p) => sum + p.seconds, 0);
}

/** Human-readable description of a technique's rhythm, e.g. "4s · 7s · 8s". */
export function rhythmLabel(technique: Technique): string {
  return technique.phases.map((p) => `${p.seconds}s`).join(' · ');
}

/** Converts a legacy flat pattern (inhale/hold1/exhale/hold2) into a Technique. */
export function patternToTechnique(
  input: { id: string; name: string; emoji: string; color: string; description: string; inhale: number; hold1: number; exhale: number; hold2: number },
): Technique {
  const phases: BreathPhase[] = [];
  if (input.inhale > 0) phases.push(phase('inhale', input.inhale, 'Inhale through your nose', 1.25));
  if (input.hold1 > 0) phases.push(phase('hold', input.hold1, 'Hold gently', 1.25));
  if (input.exhale > 0) phases.push(phase('exhale', input.exhale, 'Exhale slowly', 0.72));
  if (input.hold2 > 0) phases.push(phase('hold', input.hold2, 'Rest empty', 0.72));
  return {
    id: input.id,
    name: input.name,
    emoji: input.emoji || '🌬️',
    color: input.color,
    color2: input.color,
    tagline: rhythmLabel({ id: input.id, name: input.name, emoji: input.emoji, color: input.color, color2: input.color, tagline: '', description: input.description, benefit: '', phases } as Technique),
    description: input.description || 'Your custom routine',
    benefit: 'Custom routine',
    phases,
  };
}
