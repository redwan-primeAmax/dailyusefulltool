import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock3, Droplets, TimerReset } from 'lucide-react';
import { BackButton } from '../../../components/BackButton';
import { clockToMinutes, minutesToClock } from '../../../utils/date';
import { clamp, formatVolume } from '../../../utils/format';
import type { VolumeUnit } from '../../../types';

/** Hydration reminders run from 7:00 AM to 10:00 PM in 30-minute steps. */
const START_MIN = 7 * 60;
const END_MIN = 22 * 60;
const STEP_MIN = 30;

export type WaterToolView = 'main' | 'schedule' | 'range';

export { minutesToClock };

/** Clamps a clock string into the active reminder window, guarding bad input. */
function toWindowMinutes(value: string, fallback: number): number {
  const parsed = clockToMinutes(value);
  const base = Number.isFinite(parsed) ? parsed : fallback;
  return clamp(base, START_MIN, END_MIN);
}

/** Evenly splits the daily target across every configured reminder interval. */
export function buildSchedule(
  targetMl: number,
  startMin = START_MIN,
  endMin = END_MIN,
  stepMin = STEP_MIN,
) {
  const safeTarget = Math.max(0, Math.round(targetMl));
  const safeStart = Math.min(startMin, endMin);
  const safeEnd = Math.max(startMin, endMin);
  const safeStep = Math.max(5, stepMin);
  const slots = Math.floor((safeEnd - safeStart) / safeStep) + 1;
  const amount = Math.round(safeTarget / Math.max(1, slots));
  return Array.from({ length: slots }, (_, i) => ({
    time: safeStart + i * safeStep,
    amount,
  }));
}

/**
 * Proportional intake for a chosen window.
 * A reversed range (end before start) is treated as empty rather than
 * returning a nonsensical negative amount.
 */
export function estimateRange(
  targetMl: number,
  start: string,
  end: string,
  windowStartMin = START_MIN,
  windowEndMin = END_MIN,
): number {
  const safeTarget = Math.max(0, Math.round(targetMl));
  const from = toWindowMinutes(start, windowStartMin);
  const to = toWindowMinutes(end, windowStartMin + STEP_MIN);
  const span = Math.max(0, to - from);
  const activeWindow = windowEndMin - windowStartMin;
  if (activeWindow <= 0) return 0;
  return Math.round((safeTarget * span) / activeWindow);
}

export function WaterToolStrip({ onOpen }: { onOpen: (view: WaterToolView) => void }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface2/70 p-2 shadow-lg shadow-black/10">
      <div className="grid grid-cols-2 gap-2">
        <ToolButton
          icon={<CalendarDays className="size-5" />}
          title="Water time"
          subtitle="Half-hour schedule"
          onClick={() => onOpen('schedule')}
        />
        <ToolButton
          icon={<TimerReset className="size-5" />}
          title="Range estimate"
          subtitle="Custom window"
          onClick={() => onOpen('range')}
        />
      </div>
    </div>
  );
}

function ToolButton({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode; title: string; subtitle: string; onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl bg-surface3/60 p-3 text-left"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-orange-500/15 text-orange-300">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-ink">{title}</span>
        <span className="block truncate text-[10.5px] text-ink3">{subtitle}</span>
      </span>
    </motion.button>
  );
}

export function WaterSchedulePage({
  targetMl,
  unit,
  scheduleStartMin = START_MIN,
  scheduleEndMin = END_MIN,
  scheduleStepMin = STEP_MIN,
  onBack,
}: {
  targetMl: number;
  unit: VolumeUnit;
  scheduleStartMin?: number;
  scheduleEndMin?: number;
  scheduleStepMin?: number;
  onBack: () => void;
}) {
  const schedule = useMemo(
    () => buildSchedule(targetMl, scheduleStartMin, scheduleEndMin, scheduleStepMin),
    [targetMl, scheduleStartMin, scheduleEndMin, scheduleStepMin],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-hairline px-4 py-4">
        <p className="text-[17px] font-bold text-ink">Water time calculator</p>
        <p className="mt-0.5 text-[12px] text-ink3">
          {formatVolume(targetMl, unit)} split into {scheduleStepMin}m reminders from {minutesToClock(scheduleStartMin)} to {minutesToClock(scheduleEndMin)}
        </p>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <div className="grid grid-cols-3 gap-2.5">
          {schedule.map((slot, i) => (
            <motion.div
              key={slot.time}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.25) }}
              className="rounded-2xl border border-hairline bg-surface2/70 p-3 text-center"
            >
              <Clock3 className="mx-auto mb-1 size-4 text-orange-300" />
              <p className="text-[11px] font-bold text-ink">{minutesToClock(slot.time)}</p>
              <p className="mt-0.5 text-[12px] font-black text-sky-300">{slot.amount}ml</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-orange-500/10 p-3 text-[12px] leading-relaxed text-orange-200">
          This evenly spreads your daily target between {minutesToClock(scheduleStartMin)} and {minutesToClock(scheduleEndMin)} in {scheduleStepMin}m intervals ({schedule.length} reminders of ~{schedule[0]?.amount ?? 0}ml). You can adjust target times and intervals anytime in Water Settings.
        </div>
        <BackButton onPress={onBack} variant="pill" className="mt-5" />
      </div>
    </div>
  );
}

export function WaterRangeEstimatorPage({
  targetMl,
  unit,
  scheduleStartMin = START_MIN,
  scheduleEndMin = END_MIN,
  onBack,
}: {
  targetMl: number;
  unit: VolumeUnit;
  scheduleStartMin?: number;
  scheduleEndMin?: number;
  onBack: () => void;
}) {
  const [start, setStart] = useState('12:30');
  const [end, setEnd] = useState('13:00');
  const amount = estimateRange(targetMl, start, end, scheduleStartMin, scheduleEndMin);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <header className="glass sticky top-0 z-20 border-b border-hairline px-4 py-4">
        <p className="text-[17px] font-bold text-ink">Time-range intake estimator</p>
        <p className="mt-0.5 text-[12px] text-ink3">Pick any time window and get a proportional target.</p>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <div className="card p-4">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink3">Start</span>
              <input
                type="time"
                name="water-range-start"
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-2xl border border-hairline bg-surface3/60 px-3 py-3 text-[14px] font-bold text-ink outline-none"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink3">End</span>
              <input
                type="time"
                name="water-range-end"
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-2xl border border-hairline bg-surface3/60 px-3 py-3 text-[14px] font-bold text-ink outline-none"
              />
            </label>
          </div>

          <div className="mt-5 rounded-[28px] bg-gradient-to-br from-orange-500/20 to-red-500/15 p-5 text-center">
            <Droplets className="mx-auto mb-2 size-7 text-orange-300" />
            <p className="text-[36px] font-black tracking-tight text-ink tabular-nums">
              {amount}ml
            </p>
            <p className="mt-1 text-[12px] text-ink3">
              Recommended between {start} and {end} from a {formatVolume(targetMl, unit)} day (active: {minutesToClock(scheduleStartMin)} to {minutesToClock(scheduleEndMin)})
            </p>
          </div>
        </div>
        <BackButton onPress={onBack} variant="pill" className="mt-5" />
      </div>
    </div>
  );
}
