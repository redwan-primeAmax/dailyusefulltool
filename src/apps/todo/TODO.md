# To-Do

## Overview
Task dashboard with completion analytics, a seven-day trend graph, priorities,
starring, deadlines, and dedicated multi-day task management.

## Priority Colour Scheme
| Priority | Tone | Hex | Foreground |
| --- | --- | --- | --- |
| Low | Dark / near-black | `#1f2937` | `#94a3b8` |
| Medium | Muted warm amber | `#d9a441` | `#d9a441` |
| High | Light green / lime | `#a3e635` | `#a3e635` |

Each row renders a coloured left stripe plus a tinted pill with a dot, so the
priority reads instantly and never relies on colour alone.

## Buttons
| Button | Function |
| --- | --- |
| + | Adds the composed task |
| Floating + on dashboard | Opens the dedicated Task Management page |
| Circle | Toggles completion |
| Star | Pins a task to the top |
| Trash | Deletes the task |
| Start date / Target date | Defines a single-day or multi-day task window |

## Routing
- `main` → `TodoApp` dashboard ↔ Task Management page
- `settings` → `TodoSettings` (priority legend, backup pointer, Danger Zone)

## Danger Zone
`Erase all tasks` clears the `todos` store, returning the app to a clean
default state.

## State
Tasks live in the `todos` IndexedDB store and include `startDate`, `endDate`,
`completedAt`, and `expired` fields. Legacy tasks are normalised on load.

## Dashboard Analytics
- **Completion**: percentage of all tasks marked complete.
- **Consistency**: percentage of resolved tasks completed before expiry.
- **Missed**: task count automatically expired after a target date passes.
- **Trend graph**: seven calendar days showing due vs completed tasks; it never
  retroactively assigns a task completed today to an earlier date.
