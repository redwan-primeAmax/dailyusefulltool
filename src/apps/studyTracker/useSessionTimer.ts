import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused';

/**
 * Wall-clock accurate session timer that survives tab throttling: elapsed time
 * is derived from timestamps instead of accumulating ticks.
 */
export function useSessionTimer(onComplete?: (seconds: number) => void) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => {
      const base = startedAt.current ? performance.now() - startedAt.current : 0;
      setElapsed(Math.floor((accumulated.current + base) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [status]);

  const start = useCallback(() => {
    startedAt.current = performance.now();
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    if (startedAt.current) accumulated.current += performance.now() - startedAt.current;
    startedAt.current = null;
    setStatus('paused');
    setElapsed(Math.floor(accumulated.current / 1000));
  }, []);

  const reset = useCallback(() => {
    startedAt.current = null;
    accumulated.current = 0;
    setElapsed(0);
    setStatus('idle');
  }, []);

  /** Saves the session and resets the timer. Sub-minute runs are discarded. */
  const finish = useCallback(() => {
    const seconds = elapsed;
    reset();
    if (seconds >= 60) completeRef.current?.(seconds);
    return seconds;
  }, [elapsed, reset]);

  return useMemo(
    () => ({ status, elapsed, start, pause, reset, finish, isRunning: status === 'running' }),
    [status, elapsed, start, pause, reset, finish],
  );
}
