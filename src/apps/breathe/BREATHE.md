# Breathe

## Overview
Guided breathing app with six dedicated techniques, real-time animated guidance
and persistent session history.

## Architecture
| File | Responsibility |
| --- | --- |
| `techniques.ts` | Technique library: phase sequences, scales, instructions, rhythm helpers |
| `useBreathingSession.ts` | RAF timer state machine (starts, pauses, resumes, stops) |
| `components/BreathingRing.tsx` | Scaling disc + progress arc + live countdown |
| `components/PhaseCue.tsx` | Live guidance, step trail, cycle counter |
| `BreatheApp.tsx` | Library view ↔ dedicated session screen |

## Techniques
| Technique | Rhythm | Benefit |
| --- | --- | --- |
| Box Breathing | 4 · 4 · 4 · 4 | Focus & stress control |
| 4-7-8 Relaxation | 4 · 7 · 8 | Calming & sleep |
| Alternate Nostril | guided 4/2/4 per side | Balance & clarity |
| Belly Breathing | 5 · 5 | Grounding |
| 6-6 Paced | 6 · 6 | Heart-rate coherence |
| Alertness Breath | 2 · 2 | Energy |

Custom routines created in Settings are appended to the library automatically.
Legacy default patterns that duplicate a built-in technique are filtered out.

## The Start Bug (fixed)
Previously the session self-terminated the moment it began: a cleanup effect
called a `stop()` that was re-memoized on changing `cycles`/`totalSeconds`, so
React re-ran the cleanup after the first cycle and cleared the timer.

Fix: the engine now keeps every mutable counter in refs and runs a single
lifecycle effect keyed only on `status`. Its cleanup cancels the animation frame
and nothing else, so pressing Start reliably initialises, ticks and animates.

## Real-time Guidance
- Ring scale matches the phase: grows on inhale, shrinks on exhale, holds steady during holds.
- A progress arc fills over exactly the phase duration.
- A second-by-second countdown and a labelled cue ("Breathe in / Hold / Breathe out") update live.
- Alt-nostril shows a step trail (L nostril → both closed → R nostril …).

## Routing
- `main` → `BreatheApp` (library ↔ session)
- `settings` → `BreatheSettings` (routines + Danger Zone)

## Persistence
Stopping a run writes to the `breatheSessions` store (pattern id, name, cycles,
duration, timestamp). History survives reloads and is included in Backup exports.
The Backup app also captures all custom breathing settings and routines.
