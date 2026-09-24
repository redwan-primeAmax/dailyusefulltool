import { openDB, type IDBPDatabase } from 'idb';

export const DB_NAME = 'webos-store';
export const DB_VERSION = 5;

/** Every log store is keyed by `id` and indexed by `dateKey` + `ts`. */
export const STORE_KV = 'kv';
export const STORE_INSTALLED = 'installedApps';
export const STORE_WATER = 'waterLogs';
export const STORE_STUDY = 'studySessions';
export const STORE_EXPENSE = 'expenses';

export const LOG_STORES = [STORE_WATER, STORE_STUDY, STORE_EXPENSE] as const;
export type LogStoreName = (typeof LOG_STORES)[number];

let dbPromise: Promise<IDBPDatabase | null> | null = null;

/**
 * Opens (and lazily upgrades) the singleton IndexedDB connection.
 * Resolves to `null` when storage is unavailable (private mode / quota) so the
 * UI can fall back to an in-memory layer instead of crashing the OS shell.
 */
export function getDB(): Promise<IDBPDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
      if (!db.objectStoreNames.contains(STORE_INSTALLED)) {
        db.createObjectStore(STORE_INSTALLED, { keyPath: 'appId' });
      }
      LOG_STORES.forEach((name) => {
        if (db.objectStoreNames.contains(name)) return;
        const store = db.createObjectStore(name, { keyPath: 'id' });
        store.createIndex('by-date', 'dateKey');
        store.createIndex('by-ts', 'ts');
      });
      // App-specific stores (keyed by id, no strict schema)
      for (const extra of ['notes', 'habits', 'todos', 'flashcards', 'readings', 'breatheSessions', 'addictionCheckIns']) {
        if (!db.objectStoreNames.contains(extra)) {
          db.createObjectStore(extra, { keyPath: 'id' });
        }
      }
    },
  }).catch((error: unknown) => {
    console.warn('[indexedDB] unavailable — using volatile memory store', error);
    return null;
  });

  return dbPromise;
}

/* ------------------------------------------------------------------ */
/*  Memory fallback                                                    */
/* ------------------------------------------------------------------ */

type Row = { id?: string; appId?: string; dateKey?: string; ts?: number };
const memory = new Map<string, Map<string, Row>>();

function mem(name: string): Map<string, Row> {
  if (!memory.has(name)) memory.set(name, new Map());
  return memory.get(name) as Map<string, Row>;
}

const rowKey = (row: Row, key?: string) => String(key ?? row.id ?? row.appId ?? '');

/* ------------------------------------------------------------------ */
/*  Generic CRUD helpers                                               */
/* ------------------------------------------------------------------ */

export async function readAll<T>(store: string): Promise<T[]> {
  const db = await getDB();
  if (!db) return Array.from(mem(store).values()) as unknown as T[];
  return (await db.getAll(store)) as T[];
}

export async function readKey<T>(store: string, key: string): Promise<T | undefined> {
  const db = await getDB();
  if (!db) return mem(store).get(key) as T | undefined;
  return (await db.get(store, key)) as T | undefined;
}

/**
 * Stores that use in-line keys (`keyPath`). IndexedDB throws a `DataError`
 * if you supply an explicit key to one of these, so we strip it.
 */
const INLINE_KEY_STORES = new Set<string>([STORE_INSTALLED, ...LOG_STORES,
  'notes', 'habits', 'todos', 'flashcards', 'readings', 'breatheSessions', 'addictionCheckIns']);

export async function writeRecord<T extends Row>(store: string, value: T, key?: string) {
  const db = await getDB();
  const id = rowKey(value, key);
  if (!db) {
    mem(store).set(id, value);
    return value;
  }
  // Out-of-line key only for stores that were created without a keyPath.
  const hasInlineKey = INLINE_KEY_STORES.has(store);
  const effectiveKey = hasInlineKey ? undefined : (key ?? id);
  await db.put(store, value, effectiveKey as string | undefined);
  return value;
}

export async function deleteRecord(store: string, key: string): Promise<void> {
  const db = await getDB();
  if (!db) {
    mem(store).delete(key);
    return;
  }
  await db.delete(store, key);
}

export async function clearStore(store: string): Promise<void> {
  const db = await getDB();
  if (!db) {
    mem(store).clear();
    return;
  }
  await db.clear(store);
}

/** Range query on either the `by-date` (string) or `by-ts` (number) index. */
export async function readRange<T>(
  store: LogStoreName,
  index: 'by-date' | 'by-ts',
  lower: IDBValidKey,
  upper: IDBValidKey,
): Promise<T[]> {
  const db = await getDB();

  // A reversed window would throw inside IDBKeyRange — treat it as empty.
  const isReversed =
    typeof lower === 'number' && typeof upper === 'number'
      ? lower > upper
      : String(lower) > String(upper);
  if (isReversed) return [];

  if (!db) {
    // In-memory fallback: compare with the same type semantics as IndexedDB.
    const rows = Array.from(mem(store).values());
    const filtered = rows.filter((row) => {
      const value = index === 'by-date' ? row.dateKey : row.ts;
      if (value === undefined) return false;
      return index === 'by-ts'
        ? Number(value) >= Number(lower) && Number(value) <= Number(upper)
        : String(value) >= String(lower) && String(value) <= String(upper);
    });
    return filtered as unknown as T[];
  }

  try {
    const range = IDBKeyRange.bound(lower, upper, false, false);
    return (await db.getAllFromIndex(store, index, range)) as T[];
  } catch (error) {
    console.warn(`[indexedDB] range query failed on "${store}"`, error);
    return [];
  }
}

export async function estimateStorage(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  } catch {
    return null;
  }
}
