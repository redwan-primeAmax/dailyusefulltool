# Notes

## Overview
Colour-coded note cards with pinning, search, masonry layout, and offline
persistence.

## Architecture
`NotesApp.tsx` — masonry grid, editor with colour palette, pin/delete actions.

## Buttons
| Button | Function |
| --- | --- |
| + | Creates a new note |
| Pin | Pins the note to the top |
| Trash | Deletes the note |
| Colour swatch | Changes the note theme |

## Routing
- `main` → `NotesApp`
- `settings` → about + Danger Zone

## State
Notes persist in the `notes` store.
