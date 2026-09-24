# Read

## Overview
A calm reading room with classic public-domain pieces, custom readings,
typographic themes, and a chunked reader.

## Architecture
| File | Responsibility |
| --- | --- |
| `ReadApp.tsx` | Library + immersive reader |
| `ReadSettings.tsx` | Font size, line height, page theme, custom readings |

## Buttons
| Button | Function |
| --- | --- |
| Reading card | Opens the reader |
| Settings gear | Typography & library |
| Add to library | Registers a custom reading |

## Routing
- `main` → `ReadApp`
- `settings` → `ReadSettings`

## State
Custom readings persist in `readings`; settings in `settings:read`.
