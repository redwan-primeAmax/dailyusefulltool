import { AnimatePresence } from 'framer-motion';
import { Droplet, History } from 'lucide-react';
import { BarChart, EmptyState, StatTile, TimelineRow } from '../../../components/ui/DataViz';
import { Card } from '../../../components/ui/Card';
import { formatVolume } from '../../../utils/format';
import { dayLabel, toDateKey } from '../../../utils/date';
import type { VolumeUnit, WaterLog } from '../../../types';
import { WaterToolStrip, type WaterToolView } from './WaterTools';

export interface WaterTimelineProps {
  today: WaterLog[];
  week: { key: string; total: number }[];
  unit: VolumeUnit;
  targetMl: number;
  streak: number;
  avg7: number;
  onDelete: (id: string) => void;
  showWeek: boolean;
  onOpenTool: (view: WaterToolView) => void;
}

/** Today's log timeline + weekly trend + summary stats. */
export function WaterTimeline({
  today,
  week,
  unit,
  targetMl,
  streak,
  avg7,
  onDelete,
  showWeek,
  onOpenTool,
}: WaterTimelineProps) {
  const isTodayKey = toDateKey(new Date());
  const chart = week.map((d) => {
    const isCurrentDay = d.key === isTodayKey || d.key === week[week.length - 1]?.key;
    const isMet = d.total >= targetMl;
    return {
      key: d.key,
      label: dayLabel(d.key),
      value: d.total,
      highlight: isMet,
      emphasis: isCurrentDay,
      status: isMet
        ? ('met' as const)
        : d.total > 0 || !isCurrentDay
          ? ('missed' as const)
          : ('neutral' as const),
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Entries" value={`${today.length}`} hint="today" icon={<Droplet className="size-4" />} />
        <StatTile
          label="Streak"
          value={`${streak}d`}
          hint="goals met"
          tone={streak > 0 ? 'good' : 'default'}
        />
        <StatTile label="7-day avg" value={formatVolume(Math.round(avg7), unit)} />
      </div>

      <WaterToolStrip onOpen={onOpenTool} />

      <Card
        title="Today completion"
        subtitle="Partial progress is shown even when you miss the target"
      >
        <UnmetProgressGraph
          currentMl={today.reduce((sum, row) => sum + row.amountMl, 0)}
          targetMl={targetMl}
          unit={unit}
        />
      </Card>

      {showWeek && (
        <Card title="Last 7 days" subtitle="Dashed line marks your daily target">
          <BarChart data={chart} goal={targetMl} unit="" format={(v) => `${Math.round(v / 100) / 10}L`} />
        </Card>
      )}

      <Card title="Today's timeline" subtitle={`${today.length} entr${today.length === 1 ? 'y' : 'ies'}`}>
        <AnimatePresence initial={false}>
          {today.length === 0 ? (
            <EmptyState
              icon={<History className="size-6" />}
              title="Nothing logged yet"
              description="Hydrate and tap a quick-add preset to start your streak."
            />
          ) : (
            today.map((row) => (
              <TimelineRow
                key={row.id}
                leading={formatVolume(row.amountMl, unit).replace(/\s/g, '')}
                title={row.container ?? 'Water'}
                meta={new Date(row.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                onDelete={() => onDelete(row.id)}
                trailing={
                  <span className="text-[13px] font-bold tabular-nums text-sky-300">
                    +{formatVolume(row.amountMl, unit)}
                  </span>
                }
              />
            ))
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function UnmetProgressGraph({ currentMl, targetMl, unit }: {
  currentMl: number; targetMl: number; unit: VolumeUnit;
}) {
  const pct = targetMl <= 0 ? 0 : Math.min(100, Math.round((currentMl / targetMl) * 100));
  const met = currentMl >= targetMl;

  return (
    <div className="space-y-4 p-4 pt-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[24px] font-black leading-none text-ink tabular-nums">
            {pct}%
          </p>
          <p className="mt-1 text-[11.5px] text-ink3">
            {formatVolume(currentMl, unit)} of {formatVolume(targetMl, unit)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${met ? 'bg-emerald-500/15 text-emerald-300' : 'bg-orange-500/15 text-orange-300'}`}>
          {met ? 'Target met' : `${formatVolume(Math.max(0, targetMl - currentMl), unit)} left`}
        </span>
      </div>

      <div className="relative h-8 overflow-hidden rounded-full bg-surface3">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: met
              ? 'linear-gradient(90deg, #22c55e, #14b8a6)'
              : 'linear-gradient(0deg, #f97316 0%, #f59e0b 48%, #ef4444 100%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/18 to-transparent" />
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {[20, 40, 60, 80, 100].map((m) => (
          <div key={m} className="text-center">
            <div className={`h-1.5 rounded-full ${pct >= m ? (met ? 'bg-emerald-400' : 'bg-orange-400') : 'bg-surface3'}`} />
            <p className="mt-1 text-[9px] font-semibold text-ink3">{m}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
