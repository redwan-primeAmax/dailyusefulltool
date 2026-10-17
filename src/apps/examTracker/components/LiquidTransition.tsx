import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpenCheck, Sparkles } from 'lucide-react';
import '../examTracker.css';

function WaterWave({ slow = false }: { slow?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`exam-liquid-transition__wave absolute bottom-0 left-0 h-32 w-[200%] ${slow ? 'exam-liquid-transition__wave--slow' : ''}`}
      viewBox="0 0 400 128"
      preserveAspectRatio="none"
    >
      <path
        d="M0 26 C24 8 44 44 68 26 S112 8 136 26 S180 44 204 26 S248 8 272 26 S316 44 340 26 S376 8 400 26 V128 H0 Z"
        fill={slow ? 'rgba(255,255,255,0.24)' : 'rgba(6,95,70,0.32)'}
      />
    </svg>
  );
}

export function LiquidTransition({ onComplete }: { onComplete: () => void }) {
  const reducedMotion = useReducedMotion();
  if (typeof document === 'undefined') return null;
  return createPortal(
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Opening today’s plan"
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-700"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: reducedMotion ? 0.16 : 0.86, ease: [0.23, 1, 0.32, 1] }}
      onAnimationComplete={onComplete}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.3),transparent_40%)]" />
      <WaterWave />
      <WaterWave slow />
      {[
        { left: '17%', bottom: '15%', delay: 0.1, size: 8 },
        { left: '32%', bottom: '22%', delay: 1.0, size: 5 },
        { left: '69%', bottom: '16%', delay: 0.5, size: 10 },
        { left: '82%', bottom: '28%', delay: 1.6, size: 6 },
        { left: '53%', bottom: '12%', delay: 1.25, size: 7 },
      ].map((bubble) => (
        <span
          key={bubble.left}
          aria-hidden="true"
          className="exam-liquid-bubble absolute rounded-full border border-white/50 bg-white/25"
          style={{ left: bubble.left, bottom: bubble.bottom, width: bubble.size, height: bubble.size, animationDelay: `${bubble.delay}s` }}
        />
      ))}
      <div className="relative z-10 mx-6 text-center text-white drop-shadow-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] border border-white/30 bg-white/15 shadow-2xl shadow-emerald-950/20 backdrop-blur-md">
          <BookOpenCheck size={35} />
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/75">
          <Sparkles size={13} /> Focus starts now
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Today’s Plan</h2>
        <p className="mt-2 text-sm text-white/80">Setting up your next focused session…</p>
      </div>
    </motion.div>,
    document.body,
  );
}
