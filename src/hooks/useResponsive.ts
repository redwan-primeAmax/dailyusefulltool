import { useEffect, useState } from 'react';
import type { Breakpoint } from '../types';

interface Viewport {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  /** Renders the Android-style device frame (desktop + large tablets). */
  frame: boolean;
  touch: boolean;
}

function readViewport(): Viewport {
  const width = typeof window === 'undefined' ? 390 : window.innerWidth;
  const height = typeof window === 'undefined' ? 844 : window.innerHeight;
  const breakpoint: Breakpoint = width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  return {
    width,
    height,
    breakpoint,
    frame: width >= 1024 && !touch,
    touch,
  };
}

/** Reactive viewport + breakpoint detection with a debounced resize listener. */
export function useResponsive(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(readViewport);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setViewport(readViewport()));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return viewport;
}

/** Ticks on an interval so clocks stay live without re-rendering the world. */
export function useClock(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
