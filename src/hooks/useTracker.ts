import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { settingsService } from '../db/trackerService';
import { readAll, readRange } from '../db/indexedDB';
import type { LogStoreName } from '../db/indexedDB';
import { useDebouncedCallback } from './useDebounce';

/* ------------------------------------------------------------------ */
/*  Settings documents                                                 */
/* ------------------------------------------------------------------ */

/**
 * Loads a settings document from IndexedDB and persists (debounced) changes.
 * Optimistic local state keeps the UI instant while writes settle.
 */
export function useSettings<T extends object>(key: string, fallback: T) {
  const [settings, setSettings] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  const skipWrite = useRef(true);
  /** Latest value, so a pending debounce can still be flushed on unmount. */
  const latest = useRef<T>(fallback);
  latest.current = settings;

  useEffect(() => {
    let active = true;
    settingsService
      .get<T>(key, fallback)
      .then((value) => {
        if (!active) return;
        skipWrite.current = true;
        setSettings(value);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useDebouncedCallback((value: T) => {
    void settingsService.set(key, value);
  }, 350);

  useEffect(() => {
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    persist(settings);
  }, [settings, persist]);

  /**
   * Flush a pending debounced write on unmount. Without this, changing a
   * setting and navigating away within the debounce window silently lost the
   * change — which used to affect every app's settings at once.
   */
  const keyRef = useRef(key);
  keyRef.current = key;
  useEffect(() => {
    return () => {
      persist.cancel();
      void settingsService.set(keyRef.current, latest.current);
    };
  }, [persist]);

  const update = useCallback(<K extends keyof T>(patch: Pick<T, K> | Partial<T>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(fallback), [fallback]);

  return { settings, update, reset, setSettings, loaded };
}

/* ------------------------------------------------------------------ */
/*  Log collections                                                    */
/* ------------------------------------------------------------------ */

interface LogShape {
  id: string;
  ts: number;
  dateKey: string;
}

export type LogInput<T extends LogShape> = Omit<T, 'id' | 'ts' | 'dateKey'> & { ts?: number };

export interface Collection<T extends LogShape> {
  items: T[];
  loading: boolean;
  refresh: () => Promise<void>;
  add: (entry: LogInput<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

/** Reads a whole log store and exposes mutating helpers that refresh state. */
export function useCollection<T extends LogShape>(
  store: LogStoreName,
  create: (input: LogInput<T>) => Promise<T>,
  removeOne: (id: string) => Promise<void>,
  clearAll: () => Promise<void>,
): Collection<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const rows = await readAll<T>(store);
      rows.sort((a, b) => b.ts - a.ts);
      setItems(rows);
    } catch (error) {
      console.warn('[collection] read failed', error);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (input: LogInput<T>) => {
      const entry = await create(input);
      setItems((prev) => [entry, ...prev]);
      return entry;
    },
    [create],
  );

  const remove = useCallback(
    async (id: string) => {
      await removeOne(id);
      setItems((prev) => prev.filter((row) => row.id !== id));
    },
    [removeOne],
  );

  const clear = useCallback(async () => {
    await clearAll();
    setItems([]);
  }, [clearAll]);

  return useMemo(() => ({ items, loading, refresh, add, remove, clear }), [
    items,
    loading,
    refresh,
    add,
    remove,
    clear,
  ]);
}

/** Rows whose timestamp falls inside [start, end] — memoised derivation. */
export function useWindow<T extends LogShape>(items: T[], start: number, end: number): T[] {
  return useMemo(
    () => items.filter((row) => row.ts >= start && row.ts <= end),
    [items, start, end],
  );
}

/** Loads a raw range straight from IndexedDB (used by history screens). */
export function useRange<T extends LogShape>(store: LogStoreName, start: number, end: number) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readRange<T>(store, 'by-ts', start, end)
      .then((rows) => {
        if (!active) return;
        rows.sort((a, b) => b.ts - a.ts);
        setItems(rows);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [store, start, end]);

  return { items, loading };
}
