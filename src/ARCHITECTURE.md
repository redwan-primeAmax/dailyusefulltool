# Web OS — Architecture

## Modularity rules
- No monolithic files. Business logic, state, and presentation live in separate modules.
- Pure logic (`calculation.ts`, `chunking.ts`, `speech.ts`, `habitModel.ts`, `todoModel.ts`, `date.ts`, `format.ts`) has **zero React imports** and is independently testable.
- State machines live in `use*.ts` hooks.
- Presentational pieces live under each app's `components/` folder.
- Cross-app primitives live in `src/components/ui`.

## Directory layout
```
src/
├── apps/<app>/          app entry, hooks, logic, components/, <APP>.md
├── components/          global UI primitives + Launcher + ErrorBoundary
├── context/             OSContext (kernel), ReaderSessionContext
├── db/                  indexedDB wrapper, trackerService, backup
├── hooks/               useSettings, useCollection, useResponsive, useDebounce
├── styles/              theme tokens, wallpapers, keyframes
├── types/               shared TypeScript contracts
└── utils/               date, format, cn
```

## Single sources of truth
| Concern | Owner | Notes |
| --- | --- | --- |
| App catalog | `apps/registry.tsx` | `APP_CATALOG` is the only place an app is declared |
| Core apps | derived from `APP_CATALOG.filter(a => a.core)` | never hardcode the list |
| Date maths | `utils/date.ts` | DST-safe; always copies input `Date` objects |
| Storage | `db/indexedDB.ts` | memory fallback when IDB is blocked |
| Backups | `db/trackerService.ts` → `backupService` | validates fully before clearing |
| App documentation | `db/appDocs.ts` + `apps/triver/docs.ts` | unique export paths; maintained specs win |

## Invariants enforced by the code
1. **Mutating dates** — `startOfDay` / `startOfWeek` copy their input first.
2. **Rolling windows** — `lastDateKeys` uses calendar-day arithmetic, never `86400000` offsets, so DST cannot duplicate or skip a day.
3. **Route stack** — both `launchApp` and `openScreen` dedupe against the current top-of-stack; re-tapping the focused app cannot create a second instance.
4. **Modal layering** — `Modal` renders through a document portal at `z-[1000]`, always above the nav bar (`z-40`).
5. **Restore safety** — `backupService.restore` validates every row's `id` *before* clearing any store.
6. **Settings durability** — `useSettings` flushes its pending debounced write on unmount.
7. **Autofill** — every input declares `type`, `name`, `autoComplete`, and password-manager opt-outs (`data-1p-ignore`, `data-lpignore`, `data-form-type`).
8. **Retired apps** — startup migration drops obsolete installed records before the launcher reads them.

## Shared conventions
- **Danger Zone** — every Settings screen ends with `<DangerZone />` for destructive actions.
- **Documentation** — each app folder ships a `.md` spec; Triver packages the current suite specs into a guarded export.
- **Icons** — `AppIcon` defers SVG rendering by one tick so page structure paints first.
