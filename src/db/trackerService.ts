import {
  STORE_EXPENSE,
  STORE_INSTALLED,
  STORE_KV,
  STORE_WATER,
  clearStore,
  readAll,
  readKey,
  readRange,
  writeRecord,
  deleteRecord,
  type LogStoreName,
} from './indexedDB';
import type {
  AddictionSettings,
  AppId,
  AppManifest,
  DeviceSettings,
  ExpenseEntry,
  ExamTrackerSettings,
  ExpenseSettings,
  InstalledAppRecord,
  WaterLog,
  WaterSettings,
} from '../types';
import { toDateKey } from '../utils/date';
import { uid } from '../utils/format';

const KEY_WATER = 'settings:water';
const KEY_EXAM = 'settings:exam';
const KEY_EXPENSE = 'settings:expense';
const KEY_DEVICE = 'device:settings';
const KEY_SEED = 'meta:seeded';
const KEY_ADDICTION_CHALLENGE_MIGRATED = 'meta:addiction-challenge-migrated';

/** Storage keys used by the `useSettings` hook across all apps. */
export interface PomodoroSettings {
  focusMin: number;
  shortMin: number;
  longMin: number;
  sessionsBetweenLong: number;
  autoAdvance: boolean;
}

export const DEFAULT_POMODORO: PomodoroSettings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  sessionsBetweenLong: 4,
  autoAdvance: true,
};

export const SETTINGS_KEYS = {
  water: KEY_WATER,
  exam: KEY_EXAM,
  expense: KEY_EXPENSE,
  device: KEY_DEVICE,
  pomodoro: 'settings:pomodoro',
  habits: 'settings:habits',
  read: 'settings:read',
  memory: 'settings:memory',
  mathdash: 'settings:mathdash',
  breathe: 'settings:breathe',
  reader: 'settings:reader',
  addiction: 'settings:addiction',
  seeded: KEY_SEED,
} as const;

export const STORE_READINGS = 'readings';
export const STORE_BREATHE_SESSIONS = 'breatheSessions';

/* ------------------------------------------------------------------ */
/*  Reader                                                             */
/* ------------------------------------------------------------------ */

export interface ReaderSettingsDoc {
  chunkSize: number;
  readingMode: 'words' | 'lines';
  autoVoice: boolean;
  voiceThreshold: number;
  focusMin: number;
  breakMin: number;
}

export const DEFAULT_READER: ReaderSettingsDoc = {
  chunkSize: 3,
  readingMode: 'words',
  autoVoice: false,
  voiceThreshold: 0.62,
  focusMin: 25,
  breakMin: 5,
};

/* ------------------------------------------------------------------ */
/*  Breathe session history                                            */
/* ------------------------------------------------------------------ */

export interface BreatheSession {
  id: string;
  ts: number;
  dateKey: string;
  patternId: string;
  patternName: string;
  cycles: number;
  seconds: number;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

export const DEFAULT_WATER: WaterSettings = {
  dailyTargetMl: 2000,
  unit: 'ml',
  quickAdds: [
    { id: 'wa1', label: 'Glass', ml: 250 },
    { id: 'wa2', label: 'Bottle', ml: 500 },
    { id: 'wa3', label: 'Mug', ml: 350 },
    { id: 'wa4', label: 'Sip', ml: 200 },
  ],
  resetSchedule: 'midnight',
  glassSizeMl: 250,
  showWeekChart: true,
  scheduleStartMin: 7 * 60,  // 07:00 AM
  scheduleEndMin: 22 * 60,   // 10:00 PM
  scheduleStepMin: 30,       // 30-minute intervals
};

export const DEFAULT_ADDICTION: AddictionSettings = {
  challenge: null,
  displayUnit: 'normal',
};

export const DEFAULT_EXAM: ExamTrackerSettings = {
  subjects: [],
  geminiApiKey: '',
};

export const DEFAULT_EXPENSE: ExpenseSettings = {
  limit: 1200,
  currency: 'USD',
  period: 'weekly',
  warningThreshold: 80,
  strictMode: true,
  categories: [
    { id: 'c1', name: 'Food', emoji: '🍜', color: '#f97316' },
    { id: 'c2', name: 'Transport', emoji: '🚕', color: '#0ea5e9' },
    { id: 'c3', name: 'Shopping', emoji: '🛍️', color: '#14b8a6' },
    { id: 'c4', name: 'Bills', emoji: '🧾', color: '#ef4444' },
    { id: 'c5', name: 'Fun', emoji: '🎬', color: '#22c55e' },
  ],
};

export interface HabitSettings {
  dailyGoal: number;
  weekStartsMonday: boolean;
  showStreakFlames: boolean;
}

export const DEFAULT_HABITS: HabitSettings = {
  dailyGoal: 3,
  weekStartsMonday: true,
  showStreakFlames: true,
};

export interface BreathePattern {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  builtin: boolean;
}

export interface BreatheSettings {
  patterns: BreathePattern[];
}

export const DEFAULT_BREATHE_PATTERNS: BreathePattern[] = [
  { id: 'p1', name: '4-7-8', emoji: '😴', color: '#0ea5e9', description: 'Calming & sleep-inducing', inhale: 4, hold1: 7, exhale: 8, hold2: 0, builtin: true },
  { id: 'p2', name: 'Box', emoji: '🎯', color: '#06b6d4', description: 'Focus & balance', inhale: 4, hold1: 4, exhale: 4, hold2: 4, builtin: true },
  { id: 'p3', name: 'Relaxed', emoji: '🌿', color: '#22c55e', description: 'Stress relief', inhale: 4, hold1: 0, exhale: 6, hold2: 2, builtin: true },
  { id: 'p4', name: 'Energize', emoji: '⚡', color: '#f59e0b', description: 'Energizing breath', inhale: 6, hold1: 0, exhale: 2, hold2: 0, builtin: true },
  { id: 'p5', name: 'Deep', emoji: '🧘', color: '#14b8a6', description: 'Deep relaxation', inhale: 5, hold1: 2, exhale: 7, hold2: 0, builtin: true },
];

export const DEFAULT_BREATHE: BreatheSettings = { patterns: DEFAULT_BREATHE_PATTERNS };

export interface ReadSettings {
  fontSize: number;
  theme: 'dark' | 'sepia' | 'paper';
  lineHeight: number;
}

export const DEFAULT_READ: ReadSettings = {
  fontSize: 17,
  theme: 'dark',
  lineHeight: 1.7,
};

export interface Reading {
  id: string;
  ts: number;
  dateKey: string;
  title: string;
  author: string;
  body: string;
  builtin: boolean;
}

export const DEFAULT_READINGS: Omit<Reading, 'id' | 'ts' | 'dateKey'>[] = [
  {
    title: 'The Road Not Taken',
    author: 'Robert Frost',
    builtin: true,
    body:
      'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same.\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I—\nI took the one less traveled by,\nAnd that has made all the difference.',
  },
  {
    title: 'Invictus',
    author: 'William Ernest Henley',
    builtin: true,
    body:
      'Out of the night that covers me,\nBlack as the pit from pole to pole,\nI thank whatever gods may be\nFor my unconquerable soul.\n\nIn the fell clutch of circumstance\nI have not winced nor cried aloud.\nUnder the bludgeonings of chance\nMy head is bloody, but unbowed.\n\nIt matters not how strait the gate,\nHow charged with punishments the scroll,\nI am the master of my fate,\nI am the captain of my soul.',
  },
  {
    title: 'Ozymandias',
    author: 'Percy Bysshe Shelley',
    builtin: true,
    body:
      'I met a traveller from an antique land,\nWho said—“Two vast and trunkless legs of stone\nStand in the desert. . . . Near them, on the sand,\nHalf sunk a shattered visage lies, whose frown,\nAnd wrinkled lip, and sneer of cold command,\nTell that its sculptor well those passions read\nWhich yet survive, stamped on these lifeless things,\nThe hand that mocked them, and the heart that fed.\n\nMy name is Ozymandias, King of Kings;\nLook on my Works, ye Mighty, and despair!\nNothing beside remains. Round the decay\nOf that colossal Wreck, boundless and bare\nThe lone and level sands stretch far away.”',
  },
  {
    title: 'Down the Rabbit-Hole (excerpt)',
    author: 'Lewis Carroll',
    builtin: true,
    body:
      'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice, “without pictures or conversations?”\n\nSo she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.',
  },
];

export const DEFAULT_DEVICE: DeviceSettings = {
  wallpaper: 'cosmic',
  darkMode: true,
  animations: true,
  haptics: true,
  clock24h: false,
  profileName: 'You',
  profileAvatar: '🙂',
};

/* ------------------------------------------------------------------ */
/*  Settings (key/value documents)                                     */
/* ------------------------------------------------------------------ */

export const settingsService = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const stored = await readKey<Partial<T>>(STORE_KV, key);
    if (!stored || typeof stored !== 'object') return fallback;
    return { ...fallback, ...stored } as T;
  },
  async set<T>(key: string, value: T): Promise<T> {
    await writeRecord(STORE_KV, value as { id?: string }, key);
    return value;
  },
  water: () => settingsService.get<WaterSettings>(KEY_WATER, DEFAULT_WATER),
  exam: () => settingsService.get<ExamTrackerSettings>(KEY_EXAM, DEFAULT_EXAM),
  expense: () => settingsService.get<ExpenseSettings>(KEY_EXPENSE, DEFAULT_EXPENSE),
  device: () => settingsService.get<DeviceSettings>(KEY_DEVICE, DEFAULT_DEVICE),
  saveWater: (v: WaterSettings) => settingsService.set(KEY_WATER, v),
  saveExam: (v: ExamTrackerSettings) => settingsService.set(KEY_EXAM, v),
  saveExpense: (v: ExpenseSettings) => settingsService.set(KEY_EXPENSE, v),
  saveDevice: (v: DeviceSettings) => settingsService.set(KEY_DEVICE, v),
};

/* ------------------------------------------------------------------ */
/*  Log collections                                                    */
/* ------------------------------------------------------------------ */

interface LogShape {
  id: string;
  ts: number;
  dateKey: string;
}

function createLogService<T extends LogShape>(store: LogStoreName) {
  return {
    store,
    async all(): Promise<T[]> {
      const rows = await readAll<T>(store);
      return rows.sort((a, b) => b.ts - a.ts);
    },
    async range(startTs: number, endTs: number): Promise<T[]> {
      const rows = await readRange<T>(store, 'by-ts', startTs, endTs);
      return rows.sort((a, b) => b.ts - a.ts);
    },
    async byDates(dateKeys: string[]): Promise<T[]> {
      const rows = await readRange<T>(store, 'by-date', dateKeys[0], dateKeys[dateKeys.length - 1]);
      return rows
        .filter((row) => dateKeys.includes(row.dateKey))
        .sort((a, b) => b.ts - a.ts);
    },
    async add(input: Omit<T, 'id' | 'ts' | 'dateKey'> & Partial<Pick<T, 'ts'>>): Promise<T> {
      const ts = (input as { ts?: number }).ts ?? Date.now();
      const entry = { ...input, id: uid(), ts, dateKey: toDateKey(ts) } as T;
      await writeRecord(store, entry as { id: string });
      return entry;
    },
    async remove(id: string) {
      await deleteRecord(store, id);
    },
    async clear() {
      await clearStore(store);
    },
  };
}

export const waterLogs = createLogService<WaterLog>(STORE_WATER);
export const expenses = createLogService<ExpenseEntry>(STORE_EXPENSE);

export const waterService = { logs: waterLogs, settings: settingsService.water, saveSettings: settingsService.saveWater };
export const expenseService = { logs: expenses, settings: settingsService.expense, saveSettings: settingsService.saveExpense };

/* ------------------------------------------------------------------ */
/*  Installed apps                                                     */
/* ------------------------------------------------------------------ */

export const appService = {
  async list(): Promise<InstalledAppRecord[]> {
    return readAll<InstalledAppRecord>(STORE_INSTALLED);
  },
  async install(manifest: Pick<AppManifest, 'id' | 'version'>): Promise<InstalledAppRecord> {
    const record: InstalledAppRecord = {
      appId: manifest.id,
      version: manifest.version,
      installedAt: Date.now(),
    };
    await writeRecord(STORE_INSTALLED, record as { appId: string });
    return record;
  },
  async uninstall(appId: AppId): Promise<void> {
    await deleteRecord(STORE_INSTALLED, appId);
  },
  async wipe(appId: AppId): Promise<void> {
    if (appId === 'water') await waterLogs.clear();
    if (appId === 'exam') await settingsService.set(SETTINGS_KEYS.exam, DEFAULT_EXAM);
    if (appId === 'expense') await expenses.clear();
  },
};

/* ------------------------------------------------------------------ */
/*  First-run flag — kept so existing users keep their data, but we    */
/*  intentionally seed ZERO log entries. Apps start in a clean state.  */
/* ------------------------------------------------------------------ */

/** App ids removed from the catalog; old installs are purged at startup. */
const RETIRED_APP_IDS = ['details', 'driver', 'flashcard', 'currency', 'notes', 'study'];
const RETIRED_APP_SETTINGS_KEYS = ['settings:flashcards', 'settings:study'];

export async function seedIfFirstRun(): Promise<boolean> {
  const seeded = await readKey<boolean>(STORE_KV, KEY_SEED);
  if (!seeded) await settingsService.set(KEY_SEED, true);

  // Reset the rejected recovery-plan settings once. The new challenge profile
  // is then preserved across boots and legacy backups cannot restore old data.
  const addictionMigrated = await readKey<boolean>(STORE_KV, KEY_ADDICTION_CHALLENGE_MIGRATED);
  if (!addictionMigrated) {
    await settingsService.set(SETTINGS_KEYS.addiction, DEFAULT_ADDICTION);
    await settingsService.set(KEY_ADDICTION_CHALLENGE_MIGRATED, true);
  }

  // Always run this small idempotent cleanup, including on first boot after an
  // older backup is restored. IndexedDB v7 retired Notes/Flashcards and legacy
  // addiction check-ins; v8 also removes Study Tracker's old session store.
  await Promise.all([
    ...RETIRED_APP_IDS.map((id) => deleteRecord(STORE_INSTALLED, id)),
    ...RETIRED_APP_SETTINGS_KEYS.map((key) => deleteRecord(STORE_KV, key)),
  ]);
  return !seeded;
}

/* ------------------------------------------------------------------ */
/*  Backup / restore — exports every store + settings doc to a single */
/*  JSON blob. Consumed by the Backup app.                            */
/* ------------------------------------------------------------------ */

export interface BackupBundle {
  version: 2;
  exportedAt: number;
  device: DeviceSettings;
  installed: InstalledAppRecord[];
  /** Every settings document, keyed by its storage key. */
  settings: Record<string, unknown>;
  /** Every data store, keyed by store name. */
  stores: Record<string, unknown[]>;
  /** Legacy v1 fields kept for backward compatibility. */
  logs?: { water?: WaterLog[]; expense?: ExpenseEntry[] };
}

type JsonRecord = Record<string, unknown>;

function isCurrentAddictionSettings(value: unknown): value is AddictionSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<AddictionSettings>;
  if (!('challenge' in settings) || !['seconds', 'minutes', 'normal', 'hours'].includes(String(settings.displayUnit))) {
    return false;
  }
  if (settings.challenge === null) return true;
  const challenge = settings.challenge;
  if (!challenge || typeof challenge !== 'object') return false;
  const expectedDays = challenge.difficulty === 'easy' ? 7 : challenge.difficulty === 'medium' ? 14 : challenge.difficulty === 'hard' ? 22 : null;
  return Boolean(
    expectedDays
    && challenge.durationDays === expectedDays
    && typeof challenge.id === 'string'
    && challenge.id.trim()
    && typeof challenge.name === 'string'
    && challenge.name.trim()
    && Number.isFinite(challenge.startTs),
  );
}

/**
 * Every user-data store captured by a backup snapshot. Missing one here means
 * its data silently never leaves the device — each entry mirrors a real
 * IndexedDB object store created in `indexedDB.ts`.
 */
const BACKUP_STORES = [
  STORE_WATER, STORE_EXPENSE,
  'habits', 'todos', STORE_READINGS, STORE_BREATHE_SESSIONS,
];
const BACKUP_SETTINGS_KEYS = Object.values(SETTINGS_KEYS).filter((k) => k !== KEY_SEED);

function stripExamApiKey(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const safeValue = { ...(value as Record<string, unknown>) };
  delete safeValue.geminiApiKey;
  return safeValue;
}

/**
 * Guard against a partial restore: every data row must carry a usable `id`,
 * otherwise the write would be silently dropped while live data is gone.
 */
function assertRestorable(bundle: BackupBundle): void {
  for (const store of BACKUP_STORES) {
    const rows = bundle.stores[store] ?? [];
    rows.forEach((row, index) => {
      if (!row || typeof row !== 'object' || typeof (row as { id?: unknown }).id !== 'string') {
        throw new Error(`Backup row ${index} in "${store}" is missing an id`);
      }
    });
  }
}

/** Validates and normalizes both current v2 and legacy v1 backup files. */
function normalizeBackup(value: unknown): BackupBundle {
  if (!value || typeof value !== 'object') throw new Error('Backup must be a JSON object');
  const raw = value as JsonRecord;
  const version = raw.version;
  if (version === 2) {
    if (!raw.settings || typeof raw.settings !== 'object') throw new Error('Backup settings are missing');
    if (!raw.stores || typeof raw.stores !== 'object') throw new Error('Backup data stores are missing');
    const rawStores = raw.stores as JsonRecord;
    const settings = { ...(raw.settings as JsonRecord) };
    const examSettings = settings[SETTINGS_KEYS.exam];
    if (examSettings != null) {
      const redacted = stripExamApiKey(examSettings);
      if (redacted && typeof redacted === 'object' && Array.isArray((redacted as { subjects?: unknown }).subjects)) {
        settings[SETTINGS_KEYS.exam] = redacted;
      } else {
        delete settings[SETTINGS_KEYS.exam];
      }
    }
    const addictionSettings = settings[SETTINGS_KEYS.addiction];
    if (addictionSettings != null) {
      if (!isCurrentAddictionSettings(addictionSettings)) {
        // Older recovery-plan backups must not recreate the rejected profile or flow.
        delete settings[SETTINGS_KEYS.addiction];
      } else {
        // Keep only challenge fields; do not let stale legacy properties survive a restore.
        const { challenge, displayUnit } = addictionSettings;
        settings[SETTINGS_KEYS.addiction] = {
          displayUnit,
          challenge: challenge
            ? {
              id: challenge.id,
              name: challenge.name.trim(),
              difficulty: challenge.difficulty,
              durationDays: challenge.durationDays,
              startTs: challenge.startTs,
            }
            : null,
        } satisfies AddictionSettings;
      }
    }
    return {
      version: 2,
      exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : Date.now(),
      device: { ...DEFAULT_DEVICE, ...(raw.device && typeof raw.device === 'object' ? raw.device : {}) },
      installed: Array.isArray(raw.installed)
        ? (raw.installed as InstalledAppRecord[]).filter(
          (app) => app && !RETIRED_APP_IDS.includes(String(app.appId)),
        )
        : [],
      settings,
      stores: Object.fromEntries(
        BACKUP_STORES.map((store) => [store, Array.isArray(rawStores[store]) ? rawStores[store] : []]),
      ),
    };
  }
  if (version === 1) {
    const legacySettings = (raw.settings && typeof raw.settings === 'object' ? raw.settings : {}) as JsonRecord;
    const legacyLogs = (raw.logs && typeof raw.logs === 'object' ? raw.logs : {}) as JsonRecord;
    return {
      version: 2,
      exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : Date.now(),
      device: { ...DEFAULT_DEVICE, ...(raw.device && typeof raw.device === 'object' ? raw.device : {}) },
      installed: Array.isArray(raw.installed)
        ? (raw.installed as InstalledAppRecord[]).filter(
          (app) => app && !RETIRED_APP_IDS.includes(String(app.appId)),
        )
        : [],
      settings: {
        [KEY_WATER]: legacySettings.water ?? null,
        [KEY_EXPENSE]: legacySettings.expense ?? null,
      },
      stores: {
        [STORE_WATER]: Array.isArray(legacyLogs.water) ? legacyLogs.water : [],
        [STORE_EXPENSE]: Array.isArray(legacyLogs.expense) ? legacyLogs.expense : [],
      },
    };
  }
  throw new Error('Unsupported backup version');
}

export const backupService = {
  async export(): Promise<BackupBundle> {
    const [device, installed, settings, stores] = await Promise.all([
      settingsService.device(),
      appService.list(),
      Promise.all(BACKUP_SETTINGS_KEYS.map((k) => readKey<unknown>(STORE_KV, k))),
      Promise.all(BACKUP_STORES.map((s) => readAll<unknown>(s))),
    ]);
    return {
      version: 2,
      exportedAt: Date.now(),
      device,
      installed,
      settings: Object.fromEntries(BACKUP_SETTINGS_KEYS.map((k, i) => [
        k,
        k === SETTINGS_KEYS.exam ? stripExamApiKey(settings[i] ?? null) : settings[i] ?? null,
      ])),
      stores: Object.fromEntries(BACKUP_STORES.map((s, i) => [s, stores[i] ?? []])),
    };
  },

  /**
   * Replaces all local data with the supplied bundle (v1 or v2).
   * Validates fully *before* clearing anything, so a malformed file can never
   * leave the device wiped with nothing restored.
   */
  async restore(input: unknown): Promise<{ counts: Record<string, number> }> {
    const bundle = normalizeBackup(input);
    assertRestorable(bundle);
    const settings = bundle.settings;
    const stores = bundle.stores;

    await Promise.all([
      ...BACKUP_STORES.map((s) => clearStore(s)),
      clearStore(STORE_INSTALLED),
      clearStore(STORE_KV),
    ]);

    await settingsService.saveDevice({ ...DEFAULT_DEVICE, ...(bundle.device ?? {}) });
    await settingsService.set(KEY_SEED, true);
    await settingsService.set(KEY_ADDICTION_CHALLENGE_MIGRATED, true);
    for (const key of BACKUP_SETTINGS_KEYS) {
      const value = settings[key];
      if (value && typeof value === 'object') {
        await writeRecord(STORE_KV, value as { id?: string }, key);
      }
    }
    for (const app of bundle.installed ?? []) {
      await writeRecord(STORE_INSTALLED, app as { appId: string });
    }
    for (const store of BACKUP_STORES) {
      for (const row of stores[store] ?? []) {
        await writeRecord(store, row as { id: string });
      }
    }

    const examSettings = settings[SETTINGS_KEYS.exam];
    const examSubjects = examSettings && typeof examSettings === 'object'
      && Array.isArray((examSettings as { subjects?: unknown }).subjects)
      ? (examSettings as { subjects: unknown[] }).subjects.length
      : 0;
    return {
      counts: {
        installed: (bundle.installed ?? []).length,
        water: (stores[STORE_WATER] ?? []).length,
        expense: (stores[STORE_EXPENSE] ?? []).length,
        exam: examSubjects,
      },
    };
  },

  /** Downloads a backup as a JSON file via a transient anchor click. */
  async download(filename = 'webos-backup.json'): Promise<BackupBundle> {
    const bundle = await this.export();
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return bundle;
  },

  /** Reads a file dropped/selected by the user. */
  async readFile(file: File): Promise<BackupBundle> {
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      throw new Error('Please choose a .json backup file');
    }
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('The selected file is not valid JSON');
    }
    return normalizeBackup(parsed);
  },

  /** Resets the entire device, including app settings and challenge data. */
  async wipe(): Promise<void> {
    await Promise.all([
      ...BACKUP_STORES.map((store) => clearStore(store)),
      clearStore(STORE_INSTALLED),
      clearStore(STORE_KV),
    ]);
    await settingsService.set(KEY_SEED, true);
  },
};
