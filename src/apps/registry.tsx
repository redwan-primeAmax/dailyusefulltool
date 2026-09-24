import {
  Activity, ArrowLeftRight, BookOpen, BookOpenCheck, CheckSquare, CloudSun, Droplets,
  Flame, Gamepad2, GraduationCap, Package, Sigma, Store, Timer, Wallet, Wind, StickyNote,
} from 'lucide-react';
import type { AppManifest } from '../types';
import { StoreApp } from './store/StoreApp';
import { StoreSettings } from './store/StoreSettings';
import { WaterTracker } from './waterTracker/WaterTracker';
import { WaterSettings } from './waterTracker/WaterSettings';
import { StudyTracker } from './studyTracker/StudyTracker';
import { StudySettings } from './studyTracker/StudySettings';
import { ExpenseTracker } from './expenseTracker/ExpenseTracker';
import { ExpenseSettings } from './expenseTracker/ExpenseSettings';
import { BackupApp } from './backup/BackupApp';
import { CalculatorApp } from './calculator/CalculatorApp';
import { NotesApp } from './notes/NotesApp';
import { HabitsApp } from './habits/HabitsApp';
import { HabitsSettings } from './habits/HabitsSettings';
import { PomodoroApp } from './pomodoro/PomodoroApp';
import { PomodoroSettings } from './pomodoro/PomodoroSettings';
import { MemoryGame, MemorySettings, MathDash, MathSettings } from './games';
import { CurrencyApp } from './currency/CurrencyApp';
import { BmiApp } from './bmi/BmiApp';
import { TodoApp } from './todo/TodoApp';
import { WeatherApp } from './weather/WeatherApp';
import { FlashcardApp } from './flashcard/FlashcardApp';
import { FlashcardSettings } from './flashcard/FlashcardSettings';
import { BreatheApp } from './breathe/BreatheApp';
import { BreatheSettings } from './breathe/BreatheSettings';
import { ReadApp } from './read/ReadApp';
import { ReadSettings } from './read/ReadSettings';
import { ReaderApp } from './reader/ReaderApp';
import { ReaderSettings } from './reader/ReaderSettings';
import { TriverApp } from './triver/TriverApp';
import { TriverSettings } from './triver/TriverSettings';
import { TodoSettings } from './todo/TodoSettings';
import { AppAboutSettings } from '../components/ui/AppAboutSettings';

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function CalcSvg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="10" y2="14" />
      <line x1="14" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="10" y2="18" />
      <line x1="14" y1="18" x2="16" y2="18" />
    </svg>
  );
}

const about = (appId: string, name: string, version: string, icon: React.ReactNode, aboutText: string, dataStores: string[] = []) =>
  () => <AppAboutSettings appId={appId} name={name} version={version} icon={icon} about={aboutText} dataStores={dataStores} />;

export const APP_CATALOG: AppManifest[] = [
  /* ───── SYSTEM CORE ───── */
  {
    id: 'store', name: 'Play Store', shortName: 'Store', developer: 'Web OS Labs',
    category: 'System', subcategory: 'System', kind: 'system', version: '15.0.0', sizeMb: 24,
    rating: 4.6, reviews: '128M', installs: '10B+', updatedAt: 20,
    description: 'Browse, install and uninstall mini-apps. Installed apps appear on the home screen with offline data.',
    highlights: ['Profile with avatar & Manage Apps', '"New" shelf by release date', 'Real games section'],
    accent: '#22c55e', gradient: 'from-emerald-400 to-teal-600', icon: Store, core: true,
    screens: [{ id: 'main', component: StoreApp }, { id: 'settings', component: StoreSettings }],
  },
  {
    id: 'backup', name: 'Data Backup', shortName: 'Backup', developer: 'Web OS Cloud',
    category: 'System', subcategory: 'System', kind: 'system', hiddenFromStore: true,
    version: '1.1.0', sizeMb: 8, rating: 4.8, reviews: '17K', installs: '1M+', updatedAt: 20,
    description: 'Export every store and settings document to one JSON snapshot; restore with one tap.',
    highlights: ['Full v2 device snapshot', 'Legacy v1 restore', 'Storage estimate'],
    accent: '#94a3b8', gradient: 'from-slate-500 to-zinc-600', icon: ShieldCheckIcon, core: true,
    screens: [{ id: 'main', component: BackupApp }],
  },
  /* ───── REAL GAMES ───── */
  {
    id: 'memory', name: 'Memory Match', shortName: 'Memory', developer: 'Arcade Bay',
    category: 'Games', subcategory: 'Puzzle', kind: 'game', version: '1.0.0', sizeMb: 5,
    rating: 4.8, reviews: '32K', installs: '2M+', updatedAt: 20,
    description: 'Flip emoji cards and clear the board in as few moves as you can. 3D flip animation and best-score tracking.',
    highlights: ['3D card flips', 'Adjustable 4–12 pairs', 'Best score'],
    accent: '#14b8a6', gradient: 'from-teal-400 to-cyan-600', icon: Gamepad2, core: false,
    screens: [{ id: 'main', component: MemoryGame }, { id: 'settings', component: MemorySettings }],
  },
  {
    id: 'mathdash', name: 'Math Dash', shortName: 'Math', developer: 'Arcade Bay',
    category: 'Games', subcategory: 'Puzzle', kind: 'game', version: '1.0.0', sizeMb: 4,
    rating: 4.7, reviews: '21K', installs: '1M+', updatedAt: 20,
    description: 'Rapid-fire arithmetic against the clock with streak bonuses and two difficulty tiers.',
    highlights: ['Timed rounds', 'Streak bonuses', 'Easy / Hard modes'],
    accent: '#f59e0b', gradient: 'from-amber-400 to-orange-600', icon: Sigma, core: false,
    screens: [{ id: 'main', component: MathDash }, { id: 'settings', component: MathSettings }],
  },

  /* ───── APPS ───── */
  {
    id: 'water', name: 'Water Tracker', shortName: 'Water', developer: 'Hydra Studio',
    category: 'Health', subcategory: 'Health', kind: 'app', version: '1.5.0', sizeMb: 12,
    rating: 4.8, reviews: '92K', installs: '5M+', updatedAt: 18,
    description: 'Track daily hydration with a live ring, quick-add presets and a rolling 7-day history.',
    highlights: ['Custom ml / oz target', 'Quick-add presets', 'Rolling 7-day window'],
    accent: '#22d3ee', gradient: 'from-cyan-400 to-sky-600', icon: Droplets, core: false,
    screens: [{ id: 'main', component: WaterTracker }, { id: 'settings', component: WaterSettings }],
  },
  {
    id: 'bmi', name: 'BMI Calculator', shortName: 'BMI', developer: 'HealthLab',
    category: 'Health', subcategory: 'Health', kind: 'app', version: '2.2.0', sizeMb: 6,
    rating: 4.6, reviews: '44K', installs: '3M+', updatedAt: 16,
    description: 'Calculate your Body Mass Index with metric or imperial inputs and see your ideal weight range.',
    highlights: ['Metric & imperial', 'Animated BMI ring', 'Ideal weight range'],
    accent: '#84cc16', gradient: 'from-lime-400 to-green-600', icon: Activity, core: false,
    screens: [{ id: 'main', component: BmiApp },
      { id: 'settings', component: about('bmi', 'BMI Calculator', '2.2.0', <Activity className="size-[19px]" />, 'Body-mass index calculator with metric/imperial inputs, animated result ring and healthy-weight range.', []) }],
  },
  {
    id: 'breathe', name: 'Breathe', shortName: 'Breathe', developer: 'Calm Works',
    category: 'Health', subcategory: 'Mindfulness', kind: 'app', version: '1.4.0', sizeMb: 7,
    rating: 4.9, reviews: '61K', installs: '4M+', updatedAt: 17,
    description: 'Guided breathing exercises: 4-7-8, Box, Energize, Deep and custom patterns.',
    highlights: ['5 breathing patterns', 'Animated breathing ring', 'Session stats & cycles'],
    accent: '#14b8a6', gradient: 'from-teal-400 to-cyan-600', icon: Wind, core: false,
    screens: [{ id: 'main', component: BreatheApp }, { id: 'settings', component: BreatheSettings }],
  },
  {
    id: 'study', name: 'Study Tracker', shortName: 'Study', developer: 'Deepwork Co.',
    category: 'Productivity', subcategory: 'Productivity', kind: 'app', version: '2.1.0', sizeMb: 18,
    rating: 4.7, reviews: '51K', installs: '2M+', updatedAt: 15,
    description: 'Track focus sessions with a live timer, subjects and daily/weekly goal rings.',
    highlights: ['Live focus timer', 'Quick-log grid incl. +60 m', 'Weekly goal ring'],
    accent: '#f59e0b', gradient: 'from-amber-400 to-orange-600', icon: GraduationCap, core: false,
    screens: [{ id: 'main', component: StudyTracker }, { id: 'settings', component: StudySettings }],
  },
  {
    id: 'pomodoro', name: 'Pomodoro', shortName: 'Pomodoro', developer: 'Focus Factory',
    category: 'Productivity', subcategory: 'Focus', kind: 'app', version: '3.1.0', sizeMb: 9,
    rating: 4.8, reviews: '78K', installs: '6M+', updatedAt: 17,
    description: 'Boost productivity with the Pomodoro technique — configurable focus & break cycles.',
    highlights: ['Red focus theme', 'Dedicated settings page', 'Auto-advance control'],
    accent: '#ef4444', gradient: 'from-red-500 to-orange-600', icon: Timer, core: false,
    screens: [{ id: 'main', component: PomodoroApp }, { id: 'settings', component: PomodoroSettings }],
  },
  {
    id: 'habits', name: 'Habit Tracker', shortName: 'Habits', developer: 'Streak Labs',
    category: 'Productivity', subcategory: 'Puzzle', kind: 'app', version: '1.9.0', sizeMb: 11,
    rating: 4.7, reviews: '39K', installs: '2M+', updatedAt: 18,
    description: 'Build and maintain daily habits with streaks, emoji icons and a 7-day grid.',
    highlights: ['7-day completion grid', 'Dedicated settings page', 'Streak flames'],
    accent: '#f97316', gradient: 'from-orange-400 to-amber-600', icon: Flame, core: false,
    screens: [{ id: 'main', component: HabitsApp }, { id: 'settings', component: HabitsSettings }],
  },
  {
    id: 'todo', name: 'To-Do List', shortName: 'To-Do', developer: 'TaskMaster',
    category: 'Productivity', subcategory: 'Productivity', kind: 'app', version: '4.2.0', sizeMb: 10,
    rating: 4.8, reviews: '102K', installs: '7M+', updatedAt: 16,
    description: 'Manage tasks with priority levels, star favourites, and track completion progress.',
    highlights: ['Priority levels', 'Starred tasks', 'Progress bar'],
    accent: '#3b82f6', gradient: 'from-blue-400 to-sky-600', icon: CheckSquare, core: false,
    screens: [{ id: 'main', component: TodoApp }, { id: 'settings', component: TodoSettings }],
  },
  {
    id: 'flashcard', name: 'Flashcards', shortName: 'Cards', developer: 'StudyBuddy',
    category: 'Productivity', subcategory: 'Creative', kind: 'app', version: '2.5.0', sizeMb: 14,
    rating: 4.7, reviews: '28K', installs: '1.5M+', updatedAt: 19,
    description: 'Create, study and review flashcards with multiple decks, spaced repetition and JSON import/export.',
    highlights: ['JSON paste & file import', 'Example snippet', 'Flip animation'],
    accent: '#06b6d4', gradient: 'from-cyan-400 to-sky-600', icon: BookOpen, core: false,
    screens: [{ id: 'main', component: FlashcardApp }, { id: 'settings', component: FlashcardSettings }],
  },
  {
    id: 'notes', name: 'Notes', shortName: 'Notes', developer: 'Memo Works',
    category: 'Lifestyle', subcategory: 'Lifestyle', kind: 'app', version: '3.2.0', sizeMb: 13,
    rating: 4.8, reviews: '87K', installs: '5M+', updatedAt: 15,
    description: 'Write, pin and search colourful notes that persist offline via IndexedDB.',
    highlights: ['Masonry card grid', '6 colour themes', 'Pin & search'],
    accent: '#eab308', gradient: 'from-yellow-400 to-amber-600', icon: StickyNote, core: false,
    screens: [{ id: 'main', component: NotesApp },
      { id: 'settings', component: about('notes', 'Notes', '3.2.0', <StickyNote className="size-[19px]" />, 'Colour-coded note cards with pinning, search and offline persistence.', ['notes']) }],
  },
  {
    id: 'read', name: 'Read', shortName: 'Read', developer: 'Folio Press',
    category: 'Lifestyle', subcategory: 'Lifestyle', kind: 'app', version: '1.1.0', sizeMb: 6,
    rating: 4.8, reviews: '12K', installs: '800K+', updatedAt: 20,
    description: 'A calm reading room with classic public-domain pieces, custom readings and typographic themes.',
    highlights: ['Add/delete readings', 'Font & theme control', 'Reading-time estimate'],
    accent: '#0ea5e9', gradient: 'from-sky-400 to-blue-600', icon: BookOpen, core: false,
    screens: [{ id: 'main', component: ReadApp }, { id: 'settings', component: ReadSettings }],
  },
  {
    id: 'weather', name: 'Weather', shortName: 'Weather', developer: 'SkyView Labs',
    category: 'Lifestyle', subcategory: 'Lifestyle', kind: 'app', version: '2.6.0', sizeMb: 15,
    rating: 4.5, reviews: '210K', installs: '9M+', updatedAt: 17,
    description: 'Check conditions, 7-day forecasts and key metrics across all Bangladesh districts and world cities.',
    highlights: ['64 BD districts', 'Division browser', '7-day forecast'],
    accent: '#0ea5e9', gradient: 'from-sky-400 to-blue-600', icon: CloudSun, core: false,
    screens: [{ id: 'main', component: WeatherApp },
      { id: 'settings', component: about('weather', 'Weather', '2.6.0', <CloudSun className="size-[19px]" />, 'Simulated forecasts for every Bangladesh district and major world cities with a division browser.', []) }],
  },

  /* ───── FINANCE ───── */
  {
    id: 'expense', name: 'Expense Limiter', shortName: 'Expenses', developer: 'Frugal Works',
    category: 'Finance', subcategory: 'Finance', kind: 'app', version: '3.3.0', sizeMb: 21,
    rating: 4.9, reviews: '204K', installs: '8M+', updatedAt: 18,
    description: 'Budget challenge: set a hard limit, type any custom currency, and block overspending.',
    highlights: ['Free-form currency input', 'Strict spending cap', 'Category breakdown'],
    accent: '#ea580c', gradient: 'from-orange-500 to-red-600', icon: Wallet, core: false,
    screens: [{ id: 'main', component: ExpenseTracker }, { id: 'settings', component: ExpenseSettings }],
  },
  {
    id: 'currency', name: 'Currency', shortName: 'Currency', developer: 'FX Studio',
    category: 'Finance', subcategory: 'Finance', kind: 'app', version: '1.3.0', sizeMb: 5,
    rating: 4.6, reviews: '55K', installs: '4M+', updatedAt: 14,
    description: 'Convert between 50+ world currencies instantly with quick-amount buttons.',
    highlights: ['50+ currencies', 'Quick amounts', 'Swap animation'],
    accent: '#22c55e', gradient: 'from-emerald-400 to-green-600', icon: ArrowLeftRight, core: false,
    screens: [{ id: 'main', component: CurrencyApp },
      { id: 'settings', component: about('currency', 'Currency', '1.3.0', <ArrowLeftRight className="size-[19px]" />, 'Instant conversion across 50+ currencies against USD with quick-amount chips.', []) }],
  },

  /* ───── TOOLS ───── */
  {
    id: 'calculator', name: 'Calculator', shortName: 'Calc', developer: 'MathBox',
    category: 'Tools', subcategory: 'Tools', kind: 'app', version: '5.1.0', sizeMb: 4,
    rating: 4.9, reviews: '315K', installs: '12M+', updatedAt: 13,
    description: 'Full-featured calculator with history log, percentage and sign-flip functions.',
    highlights: ['Calculation history', 'Teal equals key', 'Percentage & +/- keys'],
    accent: '#64748b', gradient: 'from-zinc-500 to-slate-700', icon: CalcSvg, core: false,
    screens: [{ id: 'main', component: CalculatorApp },
      { id: 'settings', component: about('calculator', 'Calculator', '6.0.0', <CalcSvg className="size-[19px]" />, 'Expression calculator with a shunting-yard engine, scientific functions, memory registers and history.', []) }],
  },
  {
    id: 'reader', name: 'Reader', shortName: 'Reader', developer: 'Focus Lab',
    category: 'Productivity', subcategory: 'Focus', kind: 'app', version: '1.0.0', sizeMb: 11,
    rating: 4.8, reviews: '9K', installs: '400K+', updatedAt: 21,
    description: 'Chunked reading trainer that streams three words at a time, with voice navigation and optional Pomodoro focus blocks.',
    highlights: ['3-word chunk streaming', 'Fuzzy "Next" voice command', 'Background Pomodoro sessions'],
    accent: '#0ea5e9', gradient: 'from-sky-400 to-cyan-600', icon: BookOpenCheck, core: false,
    screens: [{ id: 'main', component: ReaderApp }, { id: 'settings', component: ReaderSettings }],
  },
  {
    id: 'triver', name: 'Triver', shortName: 'Triver', developer: 'Web OS Labs',
    category: 'Tools', subcategory: 'Tools', kind: 'app', version: '1.0.0', sizeMb: 6,
    rating: 4.7, reviews: '2K', installs: '120K+', updatedAt: 21,
    description: 'Packages every app’s Markdown documentation into a single downloadable .zip archive.',
    highlights: ['One-click .md bundle', 'Access-controlled exports', 'Always user-initiated downloads'],
    accent: '#38bdf8', gradient: 'from-sky-500 to-blue-700', icon: Package, core: false,
    screens: [{ id: 'main', component: TriverApp }, { id: 'settings', component: TriverSettings }],
  },
];

export const getAppManifest = (appId: string): AppManifest | undefined =>
  APP_CATALOG.find((app) => app.id === appId);

export const STORED_APPS = APP_CATALOG.filter((app) => !app.hiddenFromStore);
export const GAME_APPS = STORED_APPS.filter((app) => app.kind === 'game');
export const APP_APPS = STORED_APPS.filter((app) => app.kind === 'app');
export const CORE_APPS = APP_CATALOG.filter((app) => app.core);
export const STUDY_APPS = APP_CATALOG.filter((a) => ['study', 'flashcard', 'pomodoro', 'notes', 'todo', 'read'].includes(a.id));
export const APP_CATEGORIES = ['Health', 'Productivity', 'Finance', 'Lifestyle', 'Tools', 'Games'];
