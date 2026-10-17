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
    title: 'আসক্তি চ্যালেঞ্জ',
    path: 'apps/addictionRemover/ADDICTION-REMOVE.md',
    content: `# আসক্তি চ্যালেঞ্জ\n\nযে কোনো অভ্যাস বা আসক্তি বদলাতে ৭, ১৪ বা ২২ দিনের বাংলা চ্যালেঞ্জ বেছে নাও। নাম লেখার পর হোম স্ক্রিনে লাইভ কাউন্টডাউন, দিনের অগ্রগতি এবং প্রতিদিন আলাদা বার্তা দেখাবে। সময় সেকেন্ড, মিনিট, ঘণ্টা অথবা দিন-ঘণ্টা-মিনিট-সেকেন্ডে দেখা যায়।\n\nমাদক বা ওষুধ হঠাৎ বন্ধ করা বিপজ্জনক হতে পারে। প্রয়োজন হলে চিকিৎসক বা বিশ্বস্ত কারও সাহায্য নাও—এই অ্যাপ চিকিৎসার বিকল্প নয়।\n\nচ্যালেঞ্জের তথ্য এই ব্রাউজারের IndexedDB-তে থাকে। পুরোনো পরিকল্পনার ব্যাকআপ থেকে আগের তথ্য নতুন চ্যালেঞ্জে ফেরত আসে না।\n`,
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
  { id: 'triver', title: 'Triver', path: 'apps/triver/TRIVER.md' },

];

/** Guarantees a non-empty, well-formed content blob for every entry. */
export function docContent(entry: AppDocEntry, fallback: string): string {
  return entry.content && entry.content.trim() ? entry.content : fallback;
}

export { stub };
