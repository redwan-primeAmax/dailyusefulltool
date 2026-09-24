# Memory Match

## Overview
Emoji-card matching game with 3D flips, difficulty selection, a live timer, and
best-score tracking.

## Architecture
`MemoryGame` (games/memory.tsx) — difficulty picker, board, match logic.

## Buttons
| Button | Function |
| --- | --- |
| Difficulty card | Starts a board of that size |
| Flip card | Reveals a tile |
| Restart / Again | Re-deals the deck |

## Routing
- `main` → `MemoryGame`
- `settings` → `MemorySettings`

## State
Best scores persist in `settings:memory`.
