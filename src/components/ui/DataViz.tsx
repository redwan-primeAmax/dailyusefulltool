import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

/* ---------------------------- Stat tile ---------------------------- */

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: 'text-ink',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-red-400',
  };
  return (
    <div className={cn('card flex flex-col gap-1 px-4 py-3.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink3">{label}</span>
        {icon && <span className="text-ink3">{icon}</span>}
      </div>
      <span className={cn('text-[20px] font-bold leading-tight tabular-nums', tones[tone])}>{value}</span>
      {hint && <span className="text-[11.5px] text-ink3">{hint}</span>}
    </div>
  );
}

/* --------------------------- Progress bar -------------------------- */

export function ProgressBar({
  value,
  tone = 'accent',
  height = 10,
  className,
  markers,
}: {
  /** 0..100 */
  value: number;
  tone?: 'accent' | 'good' | 'warn' | 'bad';
  height?: number;
  className?: string;
  /** Optional warning marker position (percentage). */
  markers?: number[];
}) {
  const gradients: Record<string, string> = {
    accent: 'from-teal-400 to-cyan-400',
    good: 'from-emerald-400 to-teal-300',
    warn: 'from-amber-400 to-orange-400',
    bad: 'from-red-500 to-orange-400',
  };
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-full bg-surface3', className)}
      style={{ height }}
    >
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r', gradients[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 70, damping: 18 }}
      />
      {markers?.map((m) => (
        <span
          key={m}
          className="absolute top-0 h-full w-[2px] bg-black/40"
          style={{ left: `${Math.min(100, Math.max(0, m))}%` }}
        />
      ))}
    </div>
  );
}

/* ----------------------------- Bar chart --------------------------- */

export interface BarSegment {
  value: number;
  color: string;
  label?: string;
}

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** Highlight (e.g. goal reached) changes the bar fill. */
  highlight?: boolean;
  emphasis?: boolean;
  color?: string;
  status?: 'met' | 'missed' | 'today' | 'neutral';
  segments?: BarSegment[];
}

export function BarChart({
  data,
  format,
  goal,
  unit = '',
  className,
}: {
  data: BarDatum[];
  format?: (value: number) => string;
  goal?: number;
  unit?: string;
  className?: string;
}) {
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1);
  return (
    <div className={cn('flex w-full items-end justify-between gap-1.5', className)}>
      {data.map((datum, index) => {
        const isGoalDefined = goal !== undefined && goal > 0;
        const isMet = datum.highlight || (isGoalDefined && datum.value >= goal) || datum.status === 'met';
        const isMissed = datum.status === 'missed' || (isGoalDefined && datum.value < goal);
        const hasValue = datum.value > 0;
        const barHeightPct = hasValue ? Math.max(6, Math.min(100, (datum.value / max) * 100)) : 0;

        const barFillClass = datum.color
          ? datum.color
          : isMet
            ? 'bg-gradient-to-t from-emerald-500 via-teal-400 to-emerald-300 shadow-sm shadow-emerald-500/20'
            : isMissed && hasValue
              ? 'bg-gradient-to-t from-orange-500 via-rose-500 to-red-600 shadow-sm shadow-red-500/30'
              : datum.emphasis
                ? 'bg-gradient-to-t from-sky-500 to-cyan-300'
                : 'bg-white/18';

        return (
          <div key={datum.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold tabular-nums text-ink3">
              {hasValue ? (format ? format(datum.value) : `${datum.value}${unit}`) : '–'}
            </span>
            <div className="relative flex h-24 w-full items-end justify-center rounded-lg bg-surface3/50 overflow-hidden">
              {isGoalDefined && (
                <span
                  className="absolute inset-x-1 border-t border-dashed border-ink3/60 z-10"
                  style={{ bottom: `${Math.min(100, (goal / max) * 100)}%` }}
                />
              )}

              {datum.segments && datum.segments.length > 0 && hasValue ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeightPct}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 16, delay: index * 0.04 }}
                  className="w-[62%] rounded-md overflow-hidden flex flex-col-reverse"
                >
                  {datum.segments.map((seg, sIdx) => {
                    const segPct = datum.value > 0 ? (seg.value / datum.value) * 100 : 0;
                    return (
                      <div
                        key={sIdx}
                        style={{ height: `${segPct}%`, background: seg.color }}
                        className="w-full transition-all"
                        title={seg.label ? `${seg.label}: ${seg.value}` : undefined}
                      />
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: hasValue ? `${barHeightPct}%` : '2px' }}
                  transition={{ type: 'spring', stiffness: 90, damping: 16, delay: index * 0.04 }}
                  className={cn(
                    'w-[62%] rounded-md',
                    hasValue ? barFillClass : 'bg-surface3/80 h-[2px]'
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                'truncate text-[10.5px] font-semibold uppercase',
                datum.emphasis ? 'text-accent font-bold' : 'text-ink3',
              )}
            >
              {datum.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------- Empty state -------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-8 py-12 text-center', className)}>
      <span className="grid size-14 place-items-center rounded-3xl border border-hairline bg-surface3/70 text-ink3">
        {icon ?? <Inbox className="size-6" />}
      </span>
      <div>
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-ink3">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------- Timeline ----------------------------- */

export function TimelineRow({
  leading,
  title,
  meta,
  trailing,
  onDelete,
  className,
}: {
  leading: ReactNode;
  title: string;
  meta?: string;
  trailing?: ReactNode;
  onDelete?: () => void;
  className?: string;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn('flex items-center gap-3 px-4 py-3', className)}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-hairline bg-surface3/70 text-[13px] font-semibold text-ink2">
        {leading}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">{title}</p>
        {meta && <p className="truncate text-[11.5px] text-ink3">{meta}</p>}
      </div>
      {trailing}
      {onDelete && (
        <button
          type="button"
          aria-label="Delete entry"
          onClick={onDelete}
          className="tap grid size-8 place-items-center rounded-full text-ink3 hover:bg-red-500/10 hover:text-red-400"
        >
          ×
        </button>
      )}
    </motion.li>
  );
}
