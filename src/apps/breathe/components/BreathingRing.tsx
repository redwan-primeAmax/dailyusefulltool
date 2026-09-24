import { motion } from 'framer-motion';
import type { PhaseKind } from '../techniques';

export interface BreathingRingProps {
  color: string;
  kind: PhaseKind;
  secondsLeft: number;
  progress: number;
  targetScale: number;
  duration: number;
  totalSeconds: number;
  active: boolean;
}

/**
 * Central respiration visual — a soft, layered disc that expands on inhale,
 * shrinks on exhale, and holds steady during holds, wrapped by a progress arc
 * that fills over exactly the phase duration, with a live countdown.
 */
export function BreathingRing({
  color, kind, secondsLeft, progress, targetScale, duration, totalSeconds, active,
}: BreathingRingProps) {
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const restScale = kind === 'inhale' ? 0.72 : kind === 'exhale' ? 1.28 : targetScale;
  const ease: 'easeIn' | 'easeOut' | 'linear' =
    kind === 'inhale' ? 'easeIn' : kind === 'exhale' ? 'easeOut' : 'linear';

  return (
    <div className="relative grid size-[236px] place-items-center">
      {/* Concentric halo rings */}
      {active && [0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="absolute rounded-full"
          style={{ width: 210, height: 210, border: `1px solid ${color}${['40', '26', '14'][ring]}` }}
          animate={{ scale: targetScale + ring * 0.06, opacity: kind === 'hold' ? 0.5 : 0.75 }}
          transition={{ duration: Math.max(1, duration), ease }}
        />
      ))}

      {/* Scaling disc */}
      <motion.div
        className="relative grid size-[188px] place-items-center rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 38%, ${color}3a, ${color}0f 70%)`,
          boxShadow: `inset 0 0 40px ${color}22, 0 0 50px -10px ${color}55`,
        }}
        animate={active ? { scale: targetScale } : { scale: restScale }}
        transition={{ duration: active ? Math.max(1, duration) : 0.6, ease }}
        initial={false}
      >
        {/* Progress arc */}
        <svg className="absolute inset-0 -rotate-90" width="188" height="188" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="4" stroke="rgba(255,255,255,0.08)" />
          <motion.circle
            cx="100" cy="100" r={radius} fill="none" strokeWidth="4" strokeLinecap="round"
            stroke={color}
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.18, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>

        {/* Center readout */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[64px] font-extralight leading-none tabular-nums text-white">
            {secondsLeft}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color }}>
            {active ? 'seconds' : 'ready'}
          </span>
          {active && totalSeconds > 0 && (
            <span className="mt-2 text-[11px] font-semibold tabular-nums text-white/40">
              {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
