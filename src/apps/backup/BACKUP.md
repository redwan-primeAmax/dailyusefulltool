# Backup

## Overview
System-level data backup and restore utility. It creates a versioned JSON
snapshot of supported user data and restores it only after validation succeeds.

## Data Coverage
The backup includes:
- Device preferences, profile name, profile avatar emoji, and avatar image URL.
- Installed app records.
- Supported app settings documents, including the current addiction-challenge settings.
- Water logs, study sessions, expenses, habits, To-Do tasks, custom readings,
  and breathing-session history.

Challenge settings may include a user-entered habit or addiction name. Keep
exported backup files private. Browser-local data itself is not encrypted.

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
| Erase every app's data | Clears supported user data after confirmation |

## Restore Safety
1. The JSON version and required structure are normalized first.
2. Every data row is validated for an `id` before any local store is cleared.
3. Retired app records are filtered out; obsolete Notes and Flashcards stores
   and the old addiction-check-in store are not restored. Legacy recovery-plan
   settings are also discarded.
4. Only then are supported stores cleared and rehydrated.
5. The OS refreshes installed apps and device/profile state after restore.

## Routing
- `main` → `BackupApp`

## State
No application state is kept beyond the current export/import UI. Durable data
is managed exclusively by the IndexedDB and tracker service layers.
