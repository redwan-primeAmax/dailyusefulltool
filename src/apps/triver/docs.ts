import { APP_DOCS, docContent } from '../../db/appDocs';

/** In-bundle documentation registry for Triver. */
export interface DocFile {
  /** Path inside the generated zip, e.g. `apps/calculator/CALCULATOR.md`. */
  path: string;
  title: string;
  content: string;
}

/** Generates a real spec for any catalog app, so the bundle is always complete. */
function makeAppDoc(_id: string, title: string, _path: string, detail: string): string {
  return [
    `# ${title}`,
    '',
    `## Overview`,
    detail,
    '',
    `## UI`,
    '- Card-based appearance consistent with the unified store style.',
    '- Deep colour wash, smooth fade-in motion, and a single action per card.',
    '',
    `## State`,
    'All user data persists through the IndexedDB layer. Device-level and app',
    'settings live in the settings key-value store, while records live in',
    'per-application object stores. Date-window maths is daylight-saving safe.',
    '',
    `## Settings`,
    'Every app exposes a dedicated Settings page via the header gear, including a',
    '"Danger zone" for destructive data operations. Settings writes are flushed',
    'on navigation so no change is ever lost.',
    '',
    `## Backup`,
    'The Backup app captures this app’s data across every store and setting,',
    'including profile name and avatar. It is handled centrally — no per-app',
    'export is required.',
  ].join('\n');
}

const calculator = `# Calculator

## Overview
Chrome-free calculator surface modelled on native mobile calculators.
Arithmetic is fully decoupled from rendering.

## Architecture
| File | Responsibility |
| --- | --- |
| \`calculation.ts\` | Tokenizer, shunting-yard parser, RPN evaluator, formatters |
| \`useCalculator.ts\` | State machine: expression, memory, history |
| \`components/CalcDisplay.tsx\` | Expression readout + live preview |
| \`components/CalcKeypad.tsx\` | Key grid, scientific rows, press physics |
| \`CalculatorApp.tsx\` | Shell, ambient animation, history drawer |

## UI Components
- **Display**: right-aligned, auto-shrinking font (56px → 26px), grouped digits, live \`= preview\`.
- **Memory chip**: an \`M\` badge appears top-left when the memory register is non-zero.
- **Keypad**: 4×5 primary grid; scientific mode adds 3 extra rows (memory, trig, powers).

## Buttons
| Button | Function |
| --- | --- |
| AC | Clears the whole expression |
| +/− | Flips the sign of the trailing number |
| % | Wraps trailing number as \`(n/100)\` |
| ÷ × − + | Binary operators (consecutive operators collapse) |
| ⌫ | Deletes the last character |
| = | Evaluates and pushes to history |
| sin/cos/tan/ln/log/√ | Wrap the current expression in a function |
| x² / xʸ | Append \`^2\` / \`^\` |
| π / e | Insert constants |
| MC / MR / M+ / M− | Memory clear, recall, add, subtract |

## Routing
- \`main\` → \`CalculatorApp\`
- \`settings\` → about + Danger Zone

## Animations
- Display swaps with a 140 ms y-axis fade keyed on the rendered value.
- Keys use a spring \`whileTap\` scale of 0.93.
- Two ambient blurred orbs breathe on 9 s and 11 s loops.
- History drawer springs open to 168 px.

## State
\`useCalculator\` owns \`expression\`, \`history\` (capped at 60), \`memory\`, and
\`justEvaluated\` so typing a digit after \`=\` starts fresh. Keyboard input is
bound at the shell level.
`;

const reader = `# Reader

## Overview
Chunked reading trainer that streams text three words at a time, with optional
Pomodoro integration and hands-free voice navigation.

## Architecture
| File | Responsibility |
| --- | --- |
| \`chunking.ts\` | Word splitting, chunk grouping, progress + time estimates |
| \`speech.ts\` | Fuzzy command matching, Levenshtein scoring, Web Speech typings |
| \`useVoiceCommands.ts\` | Mic permission, continuous recognition, auto-restart |
| \`components/ReaderStage.tsx\` | Word stage, progress bar, nav + voice panel |
| \`ReaderApp.tsx\` | Setup screen and active session screen |
| \`../../context/ReaderSessionContext.tsx\` | Global session so it survives navigation |

## Pages
1. **Setup** — textarea, word/'~min' counter, sample loader, Pomodoro toggle with focus/break steppers, Start button.
2. **Session (plain)** — progress bar, 3-word stage, Prev/Restart/Next, voice panel.
3. **Session (Pomodoro)** — countdown card pinned above the stage; everything else identical.

## Buttons
| Button | Function |
| --- | --- |
| Use sample | Loads demo copy into the textarea |
| Start reading | Builds chunks and activates the global session |
| Prev / Next | Move one chunk (3 words) backwards/forwards |
| Restart | Jumps back to chunk 0 |
| Mic | Requests permission and toggles continuous recognition |
| Pause/Play | Pauses the Pomodoro countdown |
| ✕ (header) | Ends the session and clears background state |

## Voice Commands
Matched fuzzily so unclear pronunciation still registers:
- **next** — next, nex, necks, nekst, nest, text, forward, go, continue
- **previous** — previous, prev, back, last, reverse
- **pause** — pause, paws, stop, halt
- **restart** — restart, reset, start over, again

Scoring uses normalised Levenshtein similarity with a default 0.62 threshold,
tests every alternative the engine returns, and debounces repeats at 550 ms.

## Background Persistence
Session state lives in \`ReaderSessionProvider\` above the router, so the
countdown keeps ticking after navigating home. A pill in the navigation bar
shows the live timer (Pomodoro) or progress percent and taps back into the app.

## Animations
- Word stage: blur+slide swap, 220 ms.
- Radial glow behind the stage breathes on a 6 s loop.
- Mic button emits an expanding ring while listening.
`;

const habits = `# Habit Tracker

## Overview
Daily habit grid with streaks, flexible schedules and an archive workflow.

## Scheduling
Each habit stores a \`schedule\`:
- **Daily** — expected every day.
- **Days of week** — explicit weekday selection (Mon–Sun chips).
- **Times per week** — a numeric target; progress counts completions in the current week.

## Archive Workflow
- Habits are archived instead of deleted, retaining their full completion history.
- The **+** button opens a chooser: **New habit** or **From archive**.
- Choosing an archived habit restores it into active tracking with history intact.

## UI Components
- Progress ring (today's completions vs. daily goal).
- 7-day grid: one row per habit, tappable cells per day, streak column.
- Manage list with archive and delete actions.

## Buttons
| Button | Function |
| --- | --- |
| + | Opens the New / Archived chooser sheet |
| Grid cell | Toggles completion for that habit + date |
| Archive | Moves a habit into the archive |
| Restore | Reactivates an archived habit |
| Delete | Permanently removes a habit |

## Routing
- \`main\` → \`HabitsApp\`
- \`settings\` → goals, week start, streak flames, Danger Zone

## State
Habits persist in the \`habits\` IndexedDB store. Settings live under
\`settings:habits\`.
`;

const todo = `# To-Do

## Overview
Task manager with priorities, starring, filters and a live progress bar.

## Priority Colour Scheme
| Priority | Tone | Hex |
| --- | --- | --- |
| Low | Dark / near-black | \`#1f2937\` |
| Medium | Muted warm amber | \`#d9a441\` |
| High | Light green / lime | \`#a3e635\` |

Each row shows a coloured dot plus a matching tinted pill so priority is
readable at a glance without relying on colour alone.

## Buttons
| Button | Function |
| --- | --- |
| + | Adds the composed task |
| Circle | Toggles completion |
| Star | Pins a task to the top |
| Trash | Deletes the task |
| Filter tabs | all / active / done / starred |
| Clear completed | Bulk-removes finished tasks |

## Routing
- \`main\` → \`TodoApp\`
- \`settings\` → about + Danger Zone (erase all tasks)

## State
Tasks live in the \`todos\` IndexedDB store, sorted starred → active → newest.
`;

const breathe = `# Breathe

## Overview
Guided breathing with animated phase ring, custom routines and a persistent
session history.

## Routines
Routines are stored under \`settings:breathe\` and are fully editable:
name, emoji, colour, description and the four phase durations
(inhale, hold, exhale, hold). Built-ins can be edited, deleted and restored.

## Session Persistence
Every completed session writes to the \`breatheSessions\` store with pattern id,
cycle count, duration and timestamp. History survives app exits and is included
in Backup exports.

## UI Components
- Pattern chips (horizontal scroll).
- Breathing ring that scales with the active phase and draws a progress arc.
- Session stats: cycles, duration, pattern.
- Phase guide showing each interval.
- History list with per-session cycles and duration.

## Buttons
| Button | Function |
| --- | --- |
| Pattern chip | Selects a routine (stops any running session) |
| Play/Pause | Starts or stops the guided cycle; stopping saves the session |
| Settings gear | Opens routine management |
| Edit / Delete | Per-routine actions in Settings |
| Restore built-ins | Re-adds deleted defaults |

## Animations
Ring scales 0.85 → 1.25 across exhale/inhale with easing matched to the phase;
outer glow fades during holds.
`;

const triver = `# Triver

## Overview
Documentation exporter. Packages every app's Markdown specification into a
single downloadable \`.zip\`.

## Access Control
- Tapping **Download** opens a name modal.
- The input uses \`type="text"\`, \`name="triver-access-name"\`,
  \`autoComplete="off"\` and \`data-1p-ignore\` so password managers and browser
  autofill never attach to it.
- Validation is exact and case-sensitive after trimming: only \`REDWAN\` is
  accepted. Every other value is rejected with an inline error.

## Download Flow
1. Validate the name.
2. Build the archive in memory with JSZip.
3. Create an object URL and trigger an explicit, user-initiated anchor click.
4. Revoke the URL. No silent or automatic downloads occur.

## UI Components
- Document list showing every bundled \`.md\` file and its size.
- Archive summary card (file count, total size).
- Access modal with inline validation feedback.

## Routing
- \`main\` → \`TriverApp\`
- \`settings\` → about + Danger Zone
`;

const architecture = `# Web OS — Architecture

## Modularity Rules
- No monolithic files. Business logic, state and presentation live in separate
  modules.
- Pure logic (\`calculation.ts\`, \`chunking.ts\`, \`speech.ts\`) contains no React
  imports and is independently testable.
- State machines live in \`use*.ts\` hooks.
- Presentational pieces live under each app's \`components/\` folder.
- Cross-app primitives live in \`src/components/ui\`.

## Directory Layout
\`\`\`
src/
├── apps/<app>/            app entry, hooks, logic, components/, <APP>.md
├── components/            global UI primitives
├── context/               OS + reader session providers
├── db/                    IndexedDB wrapper, tracker service, backup
├── hooks/                 shared hooks
├── styles/                theme tokens, wallpapers, keyframes
├── types/                 shared TypeScript contracts
└── utils/                 date, format, class helpers
\`\`\`

## Shared Conventions
- **Danger Zone**: every Settings screen ends with \`<DangerZone />\` exposing
  destructive data operations behind a confirmation dialog.
- **Documentation**: every app folder ships a \`.md\` file describing UI,
  buttons, routing, animations and state. Triver exports them all.
- **Persistence**: all durable data goes through \`src/db/indexedDB.ts\`; backups
  are versioned bundles handled by \`backupService\`.
- **Icons**: \`AppIcon\` defers SVG rendering by one tick so page structure paints
  before icon work begins.
`;

const MANUAL_DOC_FILES: DocFile[] = [
  { path: 'ARCHITECTURE.md', title: 'Architecture', content: architecture },
  { path: 'apps/calculator/CALCULATOR.md', title: 'Calculator', content: calculator },
  { path: 'apps/reader/READER.md', title: 'Reader', content: reader },
  { path: 'apps/habits/HABITS.md', title: 'Habit Tracker', content: habits },
  { path: 'apps/todo/TODO.md', title: 'To-Do', content: todo },
  { path: 'apps/breathe/BREATHE.md', title: 'Breathe', content: breathe },
  { path: 'apps/triver/TRIVER.md', title: 'Triver', content: triver },
];

const GENERATED_DOC_FILES: DocFile[] = APP_DOCS.map((entry) => ({
  path: entry.path,
  title: entry.title,
  content: docContent(entry, makeAppDoc(entry.id, entry.title, entry.path, `${entry.title} — Web OS mini-app.`)),
}));

/**
 * A unique, complete archive manifest. Detailed hand-written specs are last,
 * deliberately overriding generated fallbacks with the exact same path.
 */
export const DOC_FILES: DocFile[] = Array.from(new Map(
  [...GENERATED_DOC_FILES, ...MANUAL_DOC_FILES].map((file) => [file.path, file]),
).values());

export const ACCESS_CODE = 'REDWAN';

/** Exact, case-sensitive validation after trimming surrounding whitespace. */
export function validateAccess(input: string): boolean {
  return input.trim() === ACCESS_CODE;
}

export function byteSize(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
