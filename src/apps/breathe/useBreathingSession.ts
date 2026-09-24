import { useCallback, useEffect, useRef, useState } from 'react';
import type { Technique } from './techniques';

export type SessionStatus = 'idle' | 'running' | 'paused';
export type SessionFinish = (payload: { cycles: number; seconds: number }) => void;

export interface BreathingSession {
  status: SessionStatus;
  phaseIndex: number;
  secondsLeft: number;
  totalSeconds: number;
  cycles: number;
  phase: Technique['phases'][number] | null;
  phaseProgress: number;
  start: () => void;
  /** Starts a fresh session when idle, resumes when paused. */
  startOrResume: () => void;
  togglePause: () => void;
  reset: () => void;
  stop: (onFinish: SessionFinish) => void;
}

/**
 * Respiration session state machine.
 *
 * Drives an `requestAnimationFrame` loop from wall-clock timestamps so it stays
 * accurate even when frames drop or the tab gets throttled. All mutable counters
 * live in refs; the component observes mirrored state. There is exactly one
 * lifecycle `useEffect` keyed on `status` and its cleanup cancels the animation
 * frame ONLY — it never clears the session. This fixes the previous bug where
 * re-memoized `stop()` ran during effect cleanup and killed the session the
 * moment the first cycle advanced.
 */
export function useBreathingSession(technique: Technique): BreathingSession {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(technique.phases[0]?.seconds ?? 4);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);

  /* Mutable engine state — single source of truth for the loop. */
  const idx = useRef(0);
  const phaseStart = useRef(0);                      // performance.now() at phase start
  const accTotal = useRef(0);                        // accumulated seconds
  const cycleCount = useRef(0);                      // completed cycles
  const lastTick = useRef<number | null>(null);      // timestamp of previous frame
  const raf = useRef<number>(0);
  const pausedAt = useRef<number>(0);                // when the session was paused

  /* Latest-value mirrors read inside the stable loop without re-creating it. */
  const statusRef = useRef(status);
  statusRef.current = status;
  const techRef = useRef(technique);
  techRef.current = technique;

  const commitPhase = useCallback((nextIdx: number) => {
    idx.current = nextIdx;
    setPhaseIndex(nextIdx);
    phaseStart.current = performance.now();
    setSecondsLeft(techRef.current.phases[nextIdx].seconds);
  }, []);

  const tick = useCallback((now: number) => {
    if (statusRef.current !== 'running') return;

    const dt = lastTick.current === null ? 0 : (now - lastTick.current) / 1000;
    lastTick.current = now;

    if (dt > 0) {
      accTotal.current += dt;
      setTotalSeconds(Math.floor(accTotal.current));
    }

    const phaseDur = techRef.current.phases[idx.current].seconds;
    const elapsed = (now - phaseStart.current) / 1000;
    const left = phaseDur - elapsed;
    // Only commit state when the visible second changes — a 60 fps setState
    // storm here was the source of the jank in this screen.
    const nextSecond = Math.max(0, Math.ceil(left));
    setSecondsLeft((prev) => (prev === nextSecond ? prev : nextSecond));

    if (left <= 0) {
      const nextIdx = (idx.current + 1) % techRef.current.phases.length;
      if (nextIdx === 0) {
        cycleCount.current += 1;
        setCycles(cycleCount.current);
      }
      commitPhase(nextIdx);
    }

    raf.current = requestAnimationFrame(tickRef.current);
  }, [commitPhase]);

  /* Hoist `tick` into a stable ref so the loop can call itself reliably. */
  const tickRef = useRef(tick);
  useEffect(() => { tickRef.current = tick; }, [tick]);

  /* Single lifecycle effect — cleanup cancels the frame ONLY. */
  useEffect(() => {
    if (status !== 'running') return;
    lastTick.current = null;
    // Resume must continue the phase, not restart it: shift the phase anchor
    // forward by however long we were paused.
    if (pausedAt.current > 0) {
      phaseStart.current += performance.now() - pausedAt.current;
      pausedAt.current = 0;
    } else {
      phaseStart.current = performance.now();
    }
    raf.current = requestAnimationFrame(tickRef.current);
    return () => cancelAnimationFrame(raf.current);
  }, [status]);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const start = useCallback(() => {
    idx.current = 0;
    setPhaseIndex(0);
    phaseStart.current = performance.now();
    pausedAt.current = 0;
    lastTick.current = null;
    accTotal.current = 0;
    cycleCount.current = 0;
    setTotalSeconds(0);
    setCycles(0);
    setSecondsLeft(techRef.current.phases[0]?.seconds ?? 4);
    setStatus('running');
  }, []);

  const togglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'running') {
        pausedAt.current = performance.now();
        return 'paused';
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    idx.current = 0;
    setPhaseIndex(0);
    accTotal.current = 0;
    cycleCount.current = 0;
    pausedAt.current = 0;
    setTotalSeconds(0);
    setCycles(0);
    setSecondsLeft(techRef.current.phases[0]?.seconds ?? 4);
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  const stop = useCallback((onFinish: SessionFinish) => {
    const payload = { cycles: cycleCount.current, seconds: Math.floor(accTotal.current) };
    reset();
    onFinish(payload);
  }, [reset]);

  const startOrResume = useCallback(() => {
    if (status === 'idle') start();
    else if (status === 'paused') togglePause();
  }, [status, start, togglePause]);

  const phase = techRef.current.phases[phaseIndex] ?? null;
  const phaseDur = phase?.seconds ?? 1;
  const phaseProgress = status === 'idle' ? 0 : Math.min(1, Math.max(0, (phaseDur - secondsLeft) / phaseDur));

  return {
    status,
    phaseIndex,
    secondsLeft,
    totalSeconds,
    cycles,
    phase,
    phaseProgress,
    start,
    startOrResume,
    togglePause,
    reset,
    stop,
  };
}
