# Habit Tracker

## Overview
Daily habit grid with streaks, flexible schedules and an archive workflow.

## Architecture
| File | Responsibility |
| --- | --- |
| `habitModel.ts` | Habit type, schedules, streak + weekly maths, normalisation |
| `HabitsApp.tsx` | Grid, manage list, chooser/new/archive sheets |
| `HabitsSettings.tsx` | Goals, week start, streak flames, Danger Zone |

## Scheduling
Each habit stores a `schedule`:
- **Daily** — expected every day.
- **Days of week** — explicit weekday selection (S M T W T F S chips).
- **Times per week** — a numeric target; progress counts completions in the current week.

Streaks skip non-scheduled days so a Mon/Wed/Fri habit keeps its run over the weekend.

## Archive Workflow
- Habits are archived instead of deleted, retaining their full completion history.
- The **+** button opens a chooser: **New habit** or **Archived habit**.
- Selecting an archived habit reactivates it into active tracking with history intact.

## UI Components
- Progress ring (today's completions vs. habits actually due today).
- 7-day grid: one row per habit, tappable cells, dimmed circles on rest days, streak column.
- Manage list with archive and delete actions.
- Archive summary card that opens the restore picker.

## Buttons
| Button | Function |
| --- | --- |
| + | Opens the New / Archived chooser sheet |
| Grid cell | Toggles completion for that habit + date |
| Archive | Moves a habit into the archive |
| Restore | Reactivates an archived habit |
| Trash | Permanently deletes a habit |

## Routing
- `main` → `HabitsApp`
- `settings` → `HabitsSettings`

## Animations
- Ambient orange orb breathes behind the progress card on a 7 s loop.
- Archive rows animate in/out with layout transitions.

## State
Habits persist in the `habits` IndexedDB store. Settings live under
`settings:habits`. Legacy records are upgraded by `normaliseHabit`.
