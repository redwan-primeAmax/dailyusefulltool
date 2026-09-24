# Triver

## Overview
Documentation exporter. Packages every app's Markdown specification into a
single downloadable `.zip`.

## Architecture
| File | Responsibility |
| --- | --- |
| `docs.ts` | Bundled document registry, access validation, byte helpers |
| `src/db/appDocs.ts` | Current suite documentation registry used by the archive builder |
| `TriverApp.tsx` | Hero, document list, access modal, download handler |
| `TriverSettings.tsx` | Archive info, access policy, Danger Zone |

## Access Control
- Tapping **Download documentation** opens a name modal.
- The input uses `type="text"`, `name="triver-access-name"`,
  `autoComplete="off"`, `data-1p-ignore` and `data-lpignore` so password
  managers and browser autofill never attach to it.
- Validation is exact and case-sensitive after trimming: only `REDWAN` is
  accepted. Anything else (e.g. `XYB`, `redwan`) is rejected with an inline
  error and no archive is produced.

## Download Flow
1. Validate the name.
2. Build the archive in memory with JSZip (DEFLATE) including a generated `README.md` index.
3. Create an object URL and trigger an explicit, user-initiated anchor click.
4. Revoke the URL after 1.5 s. No silent or automatic downloads occur.

## Documentation Inventory
The bundle uses a unique path manifest: detailed app specs override generated
fallbacks, preventing duplicate files or generic content from overwriting a
maintained application Markdown document.

## UI Components
- Hero card with an ambient breathing orb and archive stats.
- Document list showing every bundled `.md` file and its size.
- Access modal with animated inline validation feedback.

## Routing
- `main` → `TriverApp`
- `settings` → `TriverSettings`
