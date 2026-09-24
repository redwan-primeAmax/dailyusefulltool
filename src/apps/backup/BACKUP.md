# Backup

## Overview
System-level data backup and restore utility. It creates a versioned JSON
snapshot of all user data and restores it only after validation succeeds.

## Data Coverage
The backup includes:
- Device preferences, profile name, profile avatar emoji, and avatar image URL.
- Installed app records.
- Every app settings document.
- Water logs, study sessions, expenses, notes, habits, To-Do tasks, flashcards,
  custom readings, and breathing-session history.

## Architecture
| File | Responsibility |
| --- | --- |
| `BackupApp.tsx` | Export/import UI, progress state, import confirmation, summary |
| `src/db/trackerService.ts` | Versioned bundle build, validation, restore flow |
| `src/db/indexedDB.ts` | Object-store CRUD and IndexedDB fallback |

## Buttons
| Button | Function |
| --- | --- |
| Export | Builds and downloads `webos-backup-YYYY-MM-DD.json` |
| Import | Selects a JSON file and confirms replacement before restoring |
| Erase every app's data | Clears user data after confirmation |

## Restore Safety
1. The JSON version and required structure are normalized first.
2. Every row is validated for an `id` before any local store is cleared.
3. Only then are stores cleared and rehydrated.
4. The OS refreshes installed apps and device/profile state after restore.

## Routing
- `main` → `BackupApp`

## State
No application state is kept beyond the current export/import UI. Durable data
is managed exclusively by the IndexedDB and tracker service layers.