# Math Dash

## Overview
Rapid arithmetic game supporting all four operations, with a start screen,
in-game difficulty, streak bonuses, and a detailed report card.

## Architecture
`MathDash` (games/mathDash.tsx) — start screen, play loop, report card.

## Buttons
| Button | Function |
| --- | --- |
| Difficulty card | Begins a timed round |
| Answer tile | Submits the choice |
| End round | Finishes early |

## Routing
- `main` → `MathDash`
- `settings` → `MathSettings`

## State
Performance history persists in `settings:mathdash`.
