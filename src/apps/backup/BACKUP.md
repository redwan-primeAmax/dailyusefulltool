# Backup

## Overview
System-level data backup and restore utility. It creates a versioned JSON
snapshot of supported user data and restores it only after validation succeeds.

## Data Coverage
The backup includes:
- Device preferences, profile name, profile avatar emoji, and avatar image URL.
- Installed app records.
- Supported app settings documents, including Exam Tracker subjects and progress.
- Water logs, expenses, habits, To-Do tasks, custom readings, and
  breathing-session history.

Exam Tracker Gemini API keys are deliberately omitted from backup files. Add
the key again in Settings after restoring. Browser-local data is not encrypted.

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
3. Retired app records are filtered out; obsolete Notes, Flashcards, Study Tracker,
   and legacy addiction-check-in data are not restored.
4. Exam Tracker subjects may be restored, but API keys are always removed.
5. Only then are supported stores cleared and rehydrated.
6. The OS refreshes installed apps and device/profile state after restore.

## Routing
- `main` → `BackupApp`

## State
No application state is kept beyond the current export/import UI. Durable data
is managed exclusively by the IndexedDB and tracker service layers.
