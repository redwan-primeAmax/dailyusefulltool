import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { buildChunks, computeProgress, toWords, DEFAULT_CHUNK_SIZE } from '../apps/reader/chunking';

export type ReaderMode = 'plain' | 'pomodoro';
export type PomoPhase = 'focus' | 'break';

interface ReaderSessionValue {
  /** True once a session has been started (survives navigation). */
  active: boolean;
  mode: ReaderMode;
  chunks: string[][];
  index: number;
  totalWords: number;
  progress: ReturnType<typeof computeProgress>;
  currentChunk: string[];
  finished: boolean;

  /* Pomodoro */
  pomoPhase: PomoPhase;
  pomoRemaining: number;
  pomoRunning: boolean;
  cyclesDone: number;

  startSession: (text: string, mode: ReaderMode, opts?: { focusMin?: number; breakMin?: number; chunkSize?: number }) => void;
  endSession: () => void;
  next: () => void;
  previous: () => void;
  restart: () => void;
  togglePomo: () => void;
}

const ReaderSessionContext = createContext<ReaderSessionValue | null>(null);

export function ReaderSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<ReaderMode>('plain');
  const [chunks, setChunks] = useState<string[][]>([]);
  const [index, setIndex] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [pomoPhase, setPomoPhase] = useState<PomoPhase>('focus');
  const [pomoRemaining, setPomoRemaining] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [cyclesDone, setCyclesDone] = useState(0);
  const intervalId = useRef<number | null>(null);
  const deadline = useRef<number>(0);

  const startSession: ReaderSessionValue['startSession'] = useCallback((text, nextMode, opts) => {
    const size = opts?.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const words = toWords(text);
    setChunks(buildChunks(text, size));
    setTotalWords(words.length);
    setIndex(0);
    setMode(nextMode);
    setActive(words.length > 0);
    if (nextMode === 'pomodoro') {
      const f = opts?.focusMin ?? 25;
      const b = opts?.breakMin ?? 5;
      setFocusMin(f);
      setBreakMin(b);
      setPomoPhase('focus');
      setPomoRemaining(f * 60);
      setPomoRunning(true);
      setCyclesDone(0);
    } else {
      setPomoRunning(false);
    }
  }, []);

  const endSession = useCallback(() => {
    setActive(false);
    setPomoRunning(false);
    setChunks([]);
    setIndex(0);
    setTotalWords(0);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(0, chunks.length - 1)));
  }, [chunks.length]);

  const previous = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const restart = useCallback(() => setIndex(0), []);
  const togglePomo = useCallback(() => setPomoRunning((r) => !r), []);

  /* Pomodoro countdown — keeps ticking while the user is elsewhere.
   * Anchored on an absolute deadline rather than decrementing state, so it is
   * drift-free and the updater stays pure (React may invoke updaters twice). */
  useEffect(() => {
    if (!active || mode !== 'pomodoro' || !pomoRunning) return;

    deadline.current = Date.now() + pomoRemaining * 1000;

    const poll = () => {
      const remainingMs = deadline.current - Date.now();
      if (remainingMs > 0) {
        setPomoRemaining(Math.ceil(remainingMs / 1000));
        return;
      }
      // Phase rollover — computed outside of any state updater so it can never
      // double-fire when React re-runs an updater in StrictMode.
      setPomoPhase((phase) => {
        const nextPhase: PomoPhase = phase === 'focus' ? 'break' : 'focus';
        if (phase === 'focus') setCyclesDone((c) => c + 1);
        return nextPhase;
      });
    };

    intervalId.current = window.setInterval(poll, 250);
    return () => {
      if (intervalId.current !== null) window.clearInterval(intervalId.current);
      intervalId.current = null;
    };
  }, [active, mode, pomoRunning, pomoPhase, focusMin, breakMin]);

  // Re-anchor the deadline whenever the phase or its length changes.
  useEffect(() => {
    const seconds = pomoPhase === 'focus' ? focusMin : breakMin;
    deadline.current = Date.now() + seconds * 1000;
    setPomoRemaining(seconds * 60);
  }, [pomoPhase, focusMin, breakMin]);

  const progress = useMemo(
    () => computeProgress(index, chunks, totalWords),
    [index, chunks, totalWords],
  );

  const value = useMemo<ReaderSessionValue>(() => ({
    active,
    mode,
    chunks,
    index,
    totalWords,
    progress,
    currentChunk: chunks[index] ?? [],
    finished: chunks.length > 0 && index >= chunks.length - 1,
    pomoPhase,
    pomoRemaining,
    pomoRunning,
    cyclesDone,
    startSession,
    endSession,
    next,
    previous,
    restart,
    togglePomo,
  }), [
    active, mode, chunks, index, totalWords, progress,
    pomoPhase, pomoRemaining, pomoRunning, cyclesDone,
    startSession, endSession, next, previous, restart, togglePomo,
  ]);

  return <ReaderSessionContext.Provider value={value}>{children}</ReaderSessionContext.Provider>;
}

export function useReaderSession(): ReaderSessionValue {
  const ctx = useContext(ReaderSessionContext);
  if (!ctx) throw new Error('useReaderSession must be used inside <ReaderSessionProvider>');
  return ctx;
}
