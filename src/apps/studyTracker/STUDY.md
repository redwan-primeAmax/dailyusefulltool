# Study Tracker

## Overview
Focus-session tracker with a live timer, colour-coded subjects, daily/weekly
goal rings, trend charts, and a distraction-free full-screen focus mode.

## Architecture
| File | Responsibility |
| --- | --- |
| `useStudyTracker.ts` | Goals, subjects, sessions, derived daily/weekly metrics |
| `useSessionTimer.ts` | Drift-free wall-clock session timer |
| `components/StudyRing.tsx` | Daily ring + weekly progress bar |
| `components/SessionCard.tsx` | Timer controls + quick-log grid |
| `components/StudyHistory.tsx` | Trend chart, subject split, history |
| `components/FocusMode.tsx` | Immersive timer with pause/stop |

## Buttons
| Button | Function |
| --- | --- |
| Start / Resume | Begins the focus timer |
| Save | Logs the elapsed session |
| Reset | Discards the current timer |
| Quick log | Adds a preset duration instantly (15/25/45/60 min) |
| Settings gear | Goals, subjects, presets |

## Routing
- `main` → `StudyTracker`
- `settings` → `StudySettings`

## State
Sessions persist in `studySessions`; settings in `settings:study`.
