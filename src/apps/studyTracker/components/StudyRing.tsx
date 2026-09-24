import { motion } from 'framer-motion';
import { CircularProgress } from '../../../components/CircularProgress';
import { ProgressBar } from '../../../components/ui/DataViz';
import { formatMinutes, percent } from '../../../utils/format';
import type { StudySettings, StudySubject } from '../../../types';

export interface TodaySubjectProgress {
  subjectId: string;
  minutes: number;
  subject: StudySubject;
  pctOfGoal: number;
  pctOfTotal: number;
}

export interface StudyRingProps {
  todayMinutes: number;
  weekMinutes: number;
  sessionsToday: number;
  settings: StudySettings;
  todayBySubject?: TodaySubjectProgress[];
}

/** Dual hero: multi-color daily progress bar + weekly goal progress bar. */
export function StudyRing({
  todayMinutes,
  weekMinutes,
  sessionsToday,
  settings,
  todayBySubject = [],
}: StudyRingProps) {
  const dayPct = percent(todayMinutes, settings.dailyGoalMin);
  const weekPct = percent(weekMinutes, settings.weeklyGoalMin);
  const done = todayMinutes >= settings.dailyGoalMin;

  const topSubject = todayBySubject[0]?.subject;
  const ringPrimaryColor = done ? '#34d399' : (topSubject?.color ?? '#f59e0b');
  const ringSecondaryColor = done ? '#22d3ee' : '#38bdf8';

  return (
    <div className="flex flex-col items-center gap-5 px-4 pb-2 pt-6">
      <CircularProgress
        value={settings.dailyGoalMin > 0 ? todayMinutes / settings.dailyGoalMin : 0}
        size={208}
        thickness={17}
        from={ringPrimaryColor}
        to={ringSecondaryColor}
        gradientId="study-ring"
        celebrate={done}
        trackClassName="stroke-white/8"
      >
        <div className="flex flex-col items-center">
          <span className="text-[32px] font-bold leading-none tracking-tight text-ink tabular-nums">
            {formatMinutes(todayMinutes)}
          </span>
          <span className="mt-1 text-[12px] font-semibold text-ink3">
            of {formatMinutes(settings.dailyGoalMin)} goal
          </span>
          <span
            className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-accentsoft text-accent'
            }`}
          >
            {dayPct}% today
          </span>
        </div>
      </CircularProgress>

      {/* ── Proportional Multi-Color Daily Target Progress Bar ── */}
      <div className="w-full space-y-3 rounded-3xl border border-hairline bg-surface2/70 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-ink">
            Daily target breakdown
          </span>
          <span className="text-[13px] font-bold tabular-nums text-ink">
            {formatMinutes(todayMinutes)} / {formatMinutes(settings.dailyGoalMin)}
          </span>
        </div>

        {/* Multi-Color Segmented Bar */}
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-surface3 flex">
          {todayBySubject.length > 0 ? (
            todayBySubject.map((item) => {
              // Width relative to daily target (capped or proportional if exceeded)
              const widthPct = settings.dailyGoalMin > 0
                ? (todayMinutes > settings.dailyGoalMin
                    ? (item.minutes / todayMinutes) * 100
                    : (item.minutes / settings.dailyGoalMin) * 100)
                : 0;

              if (widthPct <= 0) return null;

              return (
                <motion.div
                  key={item.subjectId}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                  style={{ background: item.subject.color }}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                  title={`${item.subject.name}: ${formatMinutes(item.minutes)} (${Math.round(item.pctOfGoal)}% of goal)`}
                />
              );
            })
          ) : (
            <div className="h-full w-0" />
          )}
        </div>

        {/* Category breakdown chips / legend */}
        {todayBySubject.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {todayBySubject.map((item) => (
              <div
                key={item.subjectId}
                className="flex items-center gap-1.5 rounded-xl border border-hairline bg-surface3/50 px-2.5 py-1 text-[11px]"
              >
                <span className="size-2 rounded-full shrink-0" style={{ background: item.subject.color }} />
                <span className="font-semibold text-ink truncate max-w-[90px]">{item.subject.name}</span>
                <span className="font-bold tabular-nums" style={{ color: item.subject.color }}>
                  {formatMinutes(item.minutes)}
                </span>
                <span className="text-ink3 font-medium">({Math.round(item.pctOfGoal)}%)</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11.5px] text-ink3">
            No study time logged today. Select a subject below to begin.
          </p>
        )}
      </div>

      {/* ── Weekly Goal Progress Card ── */}
      <div className="w-full space-y-2 rounded-3xl border border-hairline bg-surface2/70 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-ink3">Weekly goal</span>
          <span className="text-[13px] font-bold tabular-nums text-ink">
            {formatMinutes(weekMinutes)} / {formatMinutes(settings.weeklyGoalMin)}
          </span>
        </div>
        <ProgressBar value={weekPct} tone={weekPct >= 100 ? 'good' : 'accent'} height={10} />
        <p className="text-[11.5px] text-ink3">
          {sessionsToday} session{sessionsToday === 1 ? '' : 's'} logged today ·{' '}
          {Math.max(0, settings.weeklyGoalMin - weekMinutes)} min left this week
        </p>
      </div>
    </div>
  );
}
