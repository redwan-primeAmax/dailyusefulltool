import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface CircularProgressProps {
  /** 0..1 clamped progress ratio. */
  value: number;
  size?: number;
  thickness?: number;
  trackClassName?: string;
  barClassName?: string;
  from?: string;
  to?: string;
  gradientId?: string;
  cap?: boolean;
  children?: ReactNode;
  className?: string;
  /** Adds an outer breathing halo when the goal is reached. */
  celebrate?: boolean;
}

/**
 * Accessible, animated SVG progress ring. Content is rendered inside the ring
 * so dashboards can compose metrics freely.
 */
export function CircularProgress({
  value,
  size = 208,
  thickness = 16,
  trackClassName = 'stroke-black/15',
  barClassName,
  from = '#38bdf8',
  to = '#22d3ee',
  gradientId = 'ring-gradient',
  cap = true,
  children,
  className,
  celebrate = false,
}: CircularProgressProps) {
  const ratio = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      {celebrate && (
        <span
          className="absolute inset-3 rounded-full animate-pulse-ring"
          style={{ background: `radial-gradient(circle, ${to}55, transparent 68%)` }}
        />
      )}
      <svg
        width={size}
        height={size}
        role="progressbar"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className={trackClassName}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap={cap ? 'round' : 'butt'}
          stroke={`url(#${gradientId})`}
          className={barClassName}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 60, damping: 16, mass: 0.9 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
