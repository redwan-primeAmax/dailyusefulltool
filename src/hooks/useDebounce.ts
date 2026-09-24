import { useCallback, useEffect, useRef } from 'react';

export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Discards any pending invocation. */
  cancel: () => void;
  /** Runs any pending invocation immediately. */
  flush: (...args: Args) => void;
}

/** Stable debounced callback that survives re-renders and can be cancelled. */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
): DebouncedFunction<Args> {
  const timer = useRef<number | null>(null);
  const latest = useRef(fn);
  const pending = useRef<Args | null>(null);

  useEffect(() => {
    latest.current = fn;
  }, [fn]);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const cancel = useCallback(() => {
    clear();
    pending.current = null;
  }, [clear]);

  const debounced = useCallback(
    (...args: Args) => {
      pending.current = args;
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        const call = pending.current;
        pending.current = null;
        if (call) latest.current(...call);
      }, delay);
    },
    [clear, delay],
  );

  const flush = useCallback(
    (...args: Args) => {
      clear();
      latest.current(...args);
    },
    [clear],
  );

  return Object.assign(debounced, { cancel, flush });
}
