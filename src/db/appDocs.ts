/**
 * Central documentation source of truth for every app.
 * The Triver export flow auto-includes each app's spec, so new apps are
 * picked up automatically without editing this file by hand.
 */

export interface AppDocEntry {
  id: string;
  title: string;
  path: string;
  /** Hand-written spec if present; otherwise a generated stub is used. */
  content?: string;
}

/** Compact doc template for apps without a full spec yet. */
const stub = (name: string, note: string) =>
  `# ${name}\n\n## Overview\n${note}\n\n## State\nThis app persists all user data through the IndexedDB layer and includes a\nDanger Zone in its Settings screen.\n`;

/**
 * Registry of every app-facing documentation entry. Kept in one place so the
 * Backend data layer stays authoritative and new apps are reflected in the
 * Docs bundle the moment they appear in the catalog.
 */
export const APP_DOCS: AppDocEntry[] = [
  { id: 'store', title: 'Play Store', path: 'apps/store/STORE.md' },
  { id: 'backup', title: 'Backup', path: 'apps/backup/BACKUP.md' },
  { id: 'water', title: 'Water Tracker', path: 'apps/waterTracker/WATER.md' },
  { id: 'exam', title: 'Exam Tracker', path: 'apps/examTracker/EXAM-TRACKER.md' },
  { id: 'expense', title: 'Expense Limiter', path: 'apps/expenseTracker/EXPENSE.md' },
  { id: 'pomodoro', title: 'Pomodoro', path: 'apps/pomodoro/POMODORO.md' },
  { id: 'habits', title: 'Habit Tracker', path: 'apps/habits/HABITS.md' },
  { id: 'todo', title: 'To-Do', path: 'apps/todo/TODO.md' },
  { id: 'reader', title: 'Reader', path: 'apps/reader/READER.md' },
  { id: 'breathe', title: 'Breathe', path: 'apps/breathe/BREATHE.md' },
  { id: 'weather', title: 'Weather', path: 'apps/weather/WEATHER.md' },
  {
    id: 'addiction',
    title: 'Addiction Challenge',
    path: 'apps/addictionRemover/ADDICTION-REMOVE.md',
    content: `# Addiction Challenge\n\nA personal habit-change challenge with 7-, 14-, or 22-day durations. Choose a challenge length, enter a habit or addiction name, and follow a live countdown, progress indicator, and a different supportive message each day. Countdown choices include seconds, minutes, hours, and a days-hours-minutes-seconds display.\n\n## Safety\nSuddenly stopping drugs or medication can be dangerous. Talk with a qualified clinician or someone you trust. This app is not a substitute for medical care.\n\n## Privacy and storage\nThe challenge name, duration, and display preference are stored in this browser's IndexedDB and are not sent to a server. A device backup may include the current challenge settings.\n`,
  },
  { id: 'bmi', title: 'BMI Calculator', path: 'apps/bmi/BMI.md' },
  { id: 'memory', title: 'Memory Match', path: 'apps/games/MEMORY.md' },
  { id: 'mathdash', title: 'Math Dash', path: 'apps/games/MATHDASH.md' },
  { id: 'read', title: 'Read', path: 'apps/read/READ.md' },
  { id: 'calculator', title: 'Calculator', path: 'apps/calculator/CALCULATOR.md' },
  {
    id: 'wordcounter',
    title: 'Word Counter',
    path: 'apps/wordCounter/WORD-COUNTER.md',
    content: `# Word Counter

## Overview
Word Counter analyzes text as the user types or pastes it. Bengali and other Unicode scripts are supported, and the entire analysis runs locally in the browser.

## Statistics
The live report includes word and character counts (with and without whitespace), sentences, paragraphs, lines, unique words, vocabulary diversity, average word and sentence length, longest and shortest words, reading and speaking estimates, page estimates, punctuation, standalone numbers, letters by case, whitespace, URLs, and frequently repeated words.

## Counting rules
- Words are Unicode letters, marks, or numbers; internal apostrophes stay with their word, decimals remain one number token, and web links are treated as one word.
- Characters count visible grapheme clusters when the browser supports \`Intl.Segmenter\`; otherwise Unicode code points are counted. The no-space total excludes whitespace.
- Sentence estimates recognize common English, Bengali, Arabic, and CJK terminal marks. Paragraphs are blocks separated by blank lines; lines include blank lines.
- Reading and speaking estimates use 200 and 130 words per minute. A page is estimated at 500 words.

## Privacy and state
Text is analyzed in memory and is not uploaded or saved. Paste and Copy report use the browser clipboard only after a user action. There is no app data store or settings screen.
`,
  },
  {
    id: 'pdftoimages',
    title: 'PDF to Images Converter',
    path: 'apps/pdfToImages/PDF-TO-IMAGES.md',
    content: `# PDF to Images Converter\n\n## Overview\nConvert every page in a selected PDF into an individual PNG or JPEG image and download the images in a ZIP archive. PDF rendering and ZIP creation run locally in the browser.\n\n## Workflow\n1. Choose a PDF file.\n2. Select PNG or JPEG and a render scale.\n3. Press **Process PDF** to render every page sequentially.\n4. Follow the percentage progress indicator, then download the ZIP.\n\n## Naming and performance\nImages are named \`page_1.png\`, \`page_2.png\`, and so on. When necessary, page numbers are zero-padded (for example, \`page_01.png\`) so alphabetical file listings remain in numeric order. Pages render one at a time using a reusable canvas, and generated images are stored without recompression to limit CPU and memory use.\n`,
  },
  {
    id: 'texttospeech',
    title: 'Text to Speech',
    path: 'apps/textToSpeech/TEXT-TO-SPEECH.md',
    content: `# Text to Speech\n\n## Overview\nPaste Bengali or English text, press **Done** to open the player, then play, pause, resume, replay, or stop the reading. Auto-detect splits Bengali-script and Latin-script passages and assigns a matching language code. **Play** starts with the browser/device speech voice. Use **Try online voice instead** to switch to the optional online service.\n\n## Voice and limitations\nBrowser/device speech depends on installed voices; Bengali availability varies by device. The optional keyless online voice uses Google Translate's public, unofficial listen endpoint and returns short MP3 segments. It is best-effort, may be rate-limited or changed, and is not guaranteed to be unlimited.\n\n## Privacy\nThe app does not save the pasted text or audio. The online voice sends text chunks to Google when you choose it; browser speech may be processed according to the browser/device speech provider. Do not use either voice with sensitive text unless you trust its provider.\n`,
  },
  {
    id: 'zipprocessor',
    title: 'ZIP Processor',
    path: 'apps/zipProcessor/ZIP-PROCESSOR.md',
    content: `# ZIP Processor

## Overview
ZIP Processor reads a user-selected archive locally in the browser. It shows every file for manual selection, preselects text/source files, and leaves binary, system, and configuration items unchecked by default. The user confirms the selection with **Done** before choosing an output.

## Selection rules
- Known binary formats and files that are not valid UTF-8 text are unchecked by default. If manually selected, their contents are represented by a short binary-file placeholder rather than decoded as text.
- Hidden files and common system/build/configuration files are listed but unchecked. This includes files such as \`.env\`, \`.gitignore\`, lockfiles, and common configuration formats.
- **Select all**, **Deselect all**, per-file toggles, and **Restore defaults** let the user change the selection.

## Output options
A. **Markdown** — combines selected file content under headings containing each full relative path.
B. **JSON** — creates an object keyed by selected file paths.
C. **Names as paragraphs** — writes one selected file name per plain-text paragraph.
D. **Names as Markdown** — writes selected file names as a Markdown bullet list, one line per file.
E. **ZIP structure** — creates a tree of every file and folder in the archive, including entries skipped from conversion and explicit empty folders.
F. **Names with full paths** — lists each selected file name alongside its full relative path.

## Privacy
Files are processed in memory in the browser. The archive and its contents are not uploaded or persisted by this app.
`,
  },
  {
    id: 'htmlpreview',
    title: 'HTML App Previewer',
    path: 'apps/htmlPreview/HTML-APP-PREVIEWER.md',
    content: `# HTML App Previewer\n\n## Workflow\n1. Choose or drop a web-app ZIP.\n2. Select the HTML entry page (the app prefers \`index.html\`).\n3. Press **Done · Preview app** to create a local, sandboxed iframe preview.\n\n## Content support\nSupports HTML, CSS, classic JavaScript, JavaScript modules with relative imports where possible, local JavaScript libraries, and local image, icon, font, audio, and video assets. Relative paths created at runtime by JavaScript, including new Audio(...), media src, fetch(), and XHR, are remapped to local ZIP files. Local paths are resolved relative to the HTML page, stylesheet, or module that references them. External HTTPS scripts, styles, and API requests can be enabled explicitly; network access is off by default.\n\nZIP limits are 30 MB compressed, 80 MB expanded, and 3,000 files.\n\n## Sandbox and privacy\nThe archive is processed only in browser memory and is not uploaded or stored. Preview runs with iframe sandboxing and a restrictive Content Security Policy. Local Blobs are handed into the frame, where resource URLs are created without granting same-origin access to the parent app, top navigation, or popups. Only enable network access when the app requires a trusted CDN or API.\n\nApps that depend on cookies, same-origin storage, service workers, or unsupported module/package resolution may not work in the isolated preview.\n`,
  },
  { id: 'triver', title: 'Triver', path: 'apps/triver/TRIVER.md' },

];

/** Guarantees a non-empty, well-formed content blob for every entry. */
export function docContent(entry: AppDocEntry, fallback: string): string {
  return entry.content && entry.content.trim() ? entry.content : fallback;
}

export { stub };
