# Pomodoro

## Overview
Focus/break cycle timer with a live countdown ring, configurable session
durations, auto-advance, and a red focus theme.

## Architecture
| File | Responsibility |
| --- | --- |
| `PomodoroApp.tsx` | Timer loop, phase rollover, transport controls |
| `PomodoroSettings.tsx` | Durations, sessions-per-set, auto-advance |

## Buttons
| Button | Function |
| --- | --- |
| Focus / Short / Long | Switches the active phase |
| Play / Pause | Toggles the countdown |
| Reset | Jumps back to the configured start |
| Settings gear | Durations & behaviour |

## Routing
- `main` → `PomodoroApp`
- `settings` → `PomodoroSettings`

## State
Durations persist in `settings:pomodoro`; session stats are in-memory.
