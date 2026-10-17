import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export type AppIconComponent = LucideIcon | ComponentType<React.SVGProps<SVGSVGElement>>;

/* ------------------------------------------------------------------ */
/*  OS / App catalog                                                   */
/* ------------------------------------------------------------------ */

export type AppId =
  | 'store'
  | 'water'
  | 'exam'
  | 'expense'
  | 'backup'
  | 'calculator'
  | 'habits'
  | 'pomodoro'
  | 'bmi'
  | 'todo'
  | 'weather'
  | 'breathe'
  | 'read'
  | 'memory'
  | 'mathdash'
  | 'reader'
  | 'triver'
  | 'zipprocessor'
  | 'wordcounter'
  | 'addiction';

export type ScreenId = 'main' | 'settings';

export interface AppScreenDefinition {
  id: ScreenId;
  component: ComponentType;
}

export type AppKind = 'game' | 'app' | 'system';

export interface AppManifest {
  id: AppId;
  name: string;
  shortName: string;
  developer: string;
  /** Top-level store grouping used for the "Apps" shelf. */
  category: string;
  /** Sub-category shelf label (Puzzle, Creative, Health, Finance…). */
  subcategory: string;
  /** Which top store tab the app belongs under. */
  kind: AppKind;
  /** System utilities hidden from the Play Store listings. */
  hiddenFromStore?: boolean;
  version: string;
  sizeMb: number;
  rating: number;
  reviews: string;
  installs: string;
  description: string;
  highlights: string[];
  accent: string;
  gradient: string;
  icon: AppIconComponent;
  core: boolean;
  /** Release index — higher means more recently updated (powers the "New" shelf). */
  updatedAt?: number;
  screens: AppScreenDefinition[];
}

export interface InstalledAppRecord {
  appId: AppId;
  version: string;
  installedAt: number;
}

export interface OSRoute {
  appId: AppId;
  screen: ScreenId;
  key: string;
}

/* ------------------------------------------------------------------ */
/*  Shared UI                                                          */
/* ------------------------------------------------------------------ */

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
}

/* ------------------------------------------------------------------ */
/*  Water tracker                                                      */
/* ------------------------------------------------------------------ */

export type VolumeUnit = 'ml' | 'oz';

export interface WaterQuickAdd {
  id: string;
  label: string;
  ml: number;
}

export interface WaterSettings {
  dailyTargetMl: number;
  unit: VolumeUnit;
  quickAdds: WaterQuickAdd[];
  resetSchedule: 'midnight' | '4am' | 'manual';
  glassSizeMl: number;
  showWeekChart: boolean;
  scheduleStartMin?: number; // Minutes from 00:00 (e.g. 7 * 60 = 420 for 7:00 AM)
  scheduleEndMin?: number;   // Minutes from 00:00 (e.g. 22 * 60 = 1320 for 10:00 PM)
  scheduleStepMin?: number;  // Interval in minutes (e.g. 30, 45, 60)
  manualResetTs?: number;    // Timestamp when manual reset baseline was initiated
}

/* ------------------------------------------------------------------ */
/*  Addiction challenge                                                */
/* ------------------------------------------------------------------ */

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeDurationDays = 7 | 14 | 22;
export type ChallengeTimeUnit = 'seconds' | 'minutes' | 'normal' | 'hours';

export interface AddictionChallenge {
  id: string;
  name: string;
  difficulty: ChallengeDifficulty;
  durationDays: ChallengeDurationDays;
  startTs: number;
}

export interface AddictionSettings {
  challenge: AddictionChallenge | null;
  displayUnit: ChallengeTimeUnit;
}

export interface WaterLog {
  id: string;
  ts: number;
  dateKey: string;
  amountMl: number;
  container?: string;
}

/* ------------------------------------------------------------------ */
/*  Exam tracker                                                       */
/* ------------------------------------------------------------------ */

export interface ExamCategory {
  id: string;
  name: string;
  instructions: string;
  topics: string[];
  recommendedMinutes: number;
  completed: boolean;
  completedAt?: number;
}

export interface ExamSubject {
  id: string;
  name: string;
  color: string;
  categories: ExamCategory[];
}

export interface ExamTrackerSettings {
  subjects: ExamSubject[];
  geminiApiKey: string;
}

/* ------------------------------------------------------------------ */
/*  Expense tracker                                                    */
/* ------------------------------------------------------------------ */

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

export interface ExpenseCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface ExpenseSettings {
  limit: number;
  currency: string;
  period: BudgetPeriod;
  warningThreshold: number;
  strictMode: boolean;
  categories: ExpenseCategory[];
}

export interface ExpenseEntry {
  id: string;
  ts: number;
  dateKey: string;
  amount: number;
  categoryId: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/*  Device / appearance                                                */
/* ------------------------------------------------------------------ */

export interface DeviceSettings {
  wallpaper: string;
  darkMode: boolean;
  animations: boolean;
  haptics: boolean;
  clock24h: boolean;
  /** User profile shown in the Play Store header. */
  profileName: string;
  profileAvatar: string;
}
