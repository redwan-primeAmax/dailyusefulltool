import { AnimatePresence } from 'framer-motion';
import { BookOpen, Clock } from 'lucide-react';
import { BarChart, EmptyState, StatTile, TimelineRow } from '../../../components/ui/DataViz';
import { Card } from '../../../components/ui/Card';
import { dayLabel, relativeTime } from '../../../utils/date';
import { formatMinutes, percent } from '../../../utils/format';
import type { StudySession, StudySettings } from '../../../types';

export interface StudyHistoryProps {
  sessions: StudySession[];
  week: { key: string; minutes: number }[];
  settings: StudySettings;
  todayMinutes: number;
  weekMinutes: number;
  avgSession: number;
  streak: number;
  subjectName: (id: string) => string;
  subjectColor: (id: string) => string;
  onDelete: (id: string) => void;
}

/** Trends, subject breakdown and the rolling history list. */
export function StudyHistory({
  sessions,
  week,
  settings,
  todayMinutes,
  weekMinutes,
  avgSession,
  streak,
  subjectName,
  subjectColor,
  onDelete,
}: StudyHistoryProps) {
  const chart = week.map((d) => {
    const daySessions = sessions.filter((s) => s.dateKey === d.key);
    const dayMap = new Map<string, number>();
    daySessions.forEach((s) => dayMap.set(s.subjectId, (dayMap.get(s.subjectId) ?? 0) + s.minutes));
    const segments = Array.from(dayMap.entries()).map(([subId, min]) => ({
      value: min,
      color: subjectColor(subId),
      label: subjectName(subId),
    }));

    return {
      key: d.key,
      label: dayLabel(d.key),
      value: d.minutes,
      highlight: d.minutes >= settings.dailyGoalMin,
      emphasis: d.key === week[week.length - 1]?.key,
      segments: segments.length > 0 ? segments : undefined,
    };
  });

  const maxSubject = Math.max(1, ...sessions.map((s) => s.minutes));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Today"
          value={formatMinutes(todayMinutes)}
          hint={`${percent(todayMinutes, settings.dailyGoalMin)}% of goal`}
          tone={todayMinutes >= settings.dailyGoalMin ? 'good' : 'default'}
          icon={<Clock className="size-4" />}
        />
        <StatTile
          label="This week"
          value={formatMinutes(weekMinutes)}
          hint={`${percent(weekMinutes, settings.weeklyGoalMin)}% of goal`}
        />
        <StatTile label="Avg session" value={formatMinutes(Math.round(avgSession))} />
        <StatTile label="Streak" value={`${streak}d`} tone={streak > 1 ? 'good' : 'default'} />
      </div>

      <Card title="Study trend" subtitle="Minutes per day · dashed line = daily goal">
        <BarChart data={chart} goal={settings.dailyGoalMin} format={(v) => `${Math.round(v)}m`} />
      </Card>

      <Card title="Recent sessions" subtitle={`${sessions.length} recorded`}>
        <AnimatePresence initial={false}>
          {sessions.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-6" />}
              title="No sessions yet"
              description="Run the focus timer or use a quick-log preset."
            />
          ) : (
            sessions.slice(0, 20).map((row) => (
              <TimelineRow
                key={row.id}
                leading={
                  <span
                    className="grid size-10 place-items-center rounded-2xl text-[11px] font-bold text-white"
                    style={{ background: subjectColor(row.subjectId), width: '100%' }}
                  >
                    {Math.round((row.minutes / maxSubject) * 100)}
                  </span>
                }
                title={subjectName(row.subjectId)}
                meta={`${relativeTime(row.ts)}${row.note ? ` · ${row.note}` : ''}`}
                onDelete={() => onDelete(row.id)}
                trailing={
                  <span className="text-[13px] font-bold tabular-nums text-accent">
                    {formatMinutes(row.minutes)}
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
