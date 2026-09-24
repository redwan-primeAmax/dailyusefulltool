# Reader

## Overview
Chunked reading trainer that streams text three words at a time, with optional
Pomodoro integration and hands-free voice navigation.

## Architecture
| File | Responsibility |
| --- | --- |
| `chunking.ts` | Word splitting, chunk grouping, progress + time estimates |
| `speech.ts` | Fuzzy command matching, Levenshtein scoring, Web Speech typings |
| `useVoiceCommands.ts` | Mic permission, continuous recognition, auto-restart |
| `components/ReaderStage.tsx` | Word stage, progress bar, nav + voice panel |
| `ReaderApp.tsx` | Setup screen and active session screen |
| `../../context/ReaderSessionContext.tsx` | Global session so it survives navigation |

## Pages
1. **Setup** — textarea, word/`~min` counter, sample loader, Pomodoro toggle with focus/break steppers, Start button.
2. **Session (plain)** — progress bar, 3-word stage, Prev/Restart/Next, voice panel.
3. **Session (Pomodoro)** — countdown card pinned above the stage; everything else identical.

## Buttons
| Button | Function |
| --- | --- |
| Use sample | Loads demo copy into the textarea |
| Start reading | Builds chunks and activates the global session |
| Prev / Next | Move one chunk (3 words) backwards/forwards |
| Restart | Jumps back to chunk 0 |
| Mic | Requests permission and toggles continuous recognition |
| Pause/Play | Pauses the Pomodoro countdown |
| ✕ (header) | Ends the session and clears background state |

## Voice Commands
Matched fuzzily so unclear pronunciation still registers:
- **next** — next, nex, necks, nekst, nest, text, forward, go, continue
- **previous** — previous, prev, back, last, reverse
- **pause** — pause, paws, stop, halt
- **restart** — restart, reset, start over, again

Scoring uses normalised Levenshtein similarity with a default 0.62 threshold,
tests every alternative the engine returns, and debounces repeats at 550 ms.

## Background Persistence
Session state lives in `ReaderSessionProvider` above the router, so the
countdown keeps ticking after navigating home. A pill in the navigation bar
shows the live timer (Pomodoro) or progress percent and taps back into the app.

## Animations
- Word stage: blur+slide swap, 220 ms.
- Radial glow behind the stage breathes on a 6 s loop.
- Mic button emits an expanding ring while listening.
