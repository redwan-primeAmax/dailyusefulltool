import { Droplets, Waves } from 'lucide-react';
import { CircularProgress } from '../../../components/CircularProgress';
import { formatVolume, percent } from '../../../utils/format';
import type { VolumeUnit, WaterSettings } from '../../../types';

export interface WaterRingProps {
  todayMl: number;
  settings: WaterSettings;
  unit: VolumeUnit;
}

/** Hero ring showing intake against the daily target. */
export function WaterRing({ todayMl, settings, unit }: WaterRingProps) {
  const pct = percent(todayMl, settings.dailyTargetMl);
  const remaining = Math.max(0, settings.dailyTargetMl - todayMl);
  const done = todayMl >= settings.dailyTargetMl;

  return (
    <div className="relative flex flex-col items-center gap-4 px-4 pb-2 pt-6">
      <CircularProgress
        value={todayMl / settings.dailyTargetMl}
        size={216}
        thickness={18}
        from="#38bdf8"
        to={done ? '#34d399' : '#0ea5e9'}
        gradientId="water-ring"
        celebrate={done}
        trackClassName="stroke-white/8"
      >
        <div className="flex flex-col items-center">
          <Droplets className="mb-1 size-5 text-sky-300" />
          <span className="text-[34px] font-bold leading-none tracking-tight text-ink tabular-nums">
            {formatVolume(todayMl, unit)}
          </span>
          <span className="mt-1.5 text-[12px] font-semibold text-ink3">
            of {formatVolume(settings.dailyTargetMl, unit)}
          </span>
          <span
            className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-accentsoft text-accent'
            }`}
          >
            {pct}%
          </span>
        </div>
      </CircularProgress>
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink2">
        <Waves className="size-4 text-sky-300" />
        {done
          ? `Goal reached — ${formatVolume(todayMl - settings.dailyTargetMl, unit)} over target`
          : `${formatVolume(remaining, unit)} left today`}
      </p>
    </div>
  );
}
