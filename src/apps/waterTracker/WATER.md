# Water Tracker

## Overview
Daily hydration tracker with a live progress ring, quick-add presets, streak
tracking, a rolling 7-day window, and two planning tools.

## Dashboard
- **Today completion** renders the real logged/target percentage, including
  partial goals. An unmet target uses an orange → amber → red fill; a met goal
  shifts to an emerald/teal completion fill.
- **Metrics** show total entries, active streak, and rolling 7-day average.

## Architecture
| File | Responsibility |
| --- | --- |
| `useWaterTracker.ts` | Aggregated state: settings + logs + daily/weekly metrics |
| `components/WaterRing.tsx` | Hero progress ring with celebration halo |
| `components/QuickAddBar.tsx` | Preset chips, custom amount sheet, undo |
| `components/WaterTimeline.tsx` | Stats, completion graph, weekly chart, history |
| `components/WaterTools.tsx` | Schedule + range-estimator sub-pages |
| `WaterSettings.tsx` | Goal, unit, presets, reset schedule, Danger Zone |

## Tools
- **Water time** — splits the daily target into half-hour reminders (7 AM–10 PM).
- **Range estimator** — computes a proportional intake for any custom time window.

## Buttons
| Button | Function |
| --- | --- |
| Quick-add chip | Logs a preset amount instantly |
| Undo last | Removes the most recent entry |
| Custom | Opens an amount entry sheet |
| Settings gear | Goal, units, presets, reset schedule |

## Routing
- `main` → `WaterTracker`
- `settings` → `WaterSettings`

## State
Logs persist in the `waterLogs` store; settings in `settings:water`.
Settings writes flush before navigation, so goal/preset changes are not lost.
