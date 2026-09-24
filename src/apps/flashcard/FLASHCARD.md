# Flashcards

## Overview
Study tool with multiple decks, 3D flip cards, known/unknown tracking, and JSON
import/export handled centrally by the Backup app.

## Architecture
| File | Responsibility |
| --- | --- |
| `FlashcardApp.tsx` | Deck picker, study flow, card management |
| `FlashcardSettings.tsx` | JSON import (paste/file), danger zone |

## Buttons
| Button | Function |
| --- | --- |
| Study Now | Starts a shuffled deck session |
| Got it / Missed | Marks the card and advances |
| + | Adds a card |
| Import | Pastes or uploads JSON |

## Routing
- `main` → `FlashcardApp`
- `settings` → `FlashcardSettings`

## State
Cards persist in `flashcards`.
