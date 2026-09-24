import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, RotateCcw, Save, Square, StopCircle } from 'lucide-react';
import { CustomButton } from '../../../components/CustomButton';
import { Chip } from '../../../components/ui/controls';
import { CircularProgress } from '../../../components/CircularProgress';
import { formatDuration, formatMinutes } from '../../../utils/format';
import type { StudySubject } from '../../../types';
import type { TimerStatus } from '../useSessionTimer';

export interface SessionCardProps {
  status: TimerStatus;
  elapsed: number;
  subjectId: string;
  subjects: StudySubject[];
  presets: number[];
  onSelectSubject: (id: string) => void;
  onQuickLog: (minutes: number) => void;
  onStart: () => void;
  onPause: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  defaultSessionMin?: number;
}

/** Live session timer + quick session logger with a distraction-free focus mode. */
export function SessionCard({
  status,
  elapsed,
  subjectId,
  subjects,
  presets,
  onSelectSubject,
  onQuickLog,
  onStart,
  onPause,
  onFinish,
  onDiscard,
  defaultSessionMin = 45,
}: SessionCardProps) {
  const [focused, setFocused] = useState(false);
  const active = status !== 'idle';
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];

  // Guarantee 45m and 60m are present and ordered; render a fixed 4-slot row.
  const quickPresets = useMemo(() => {
    const set = new Set<number>(presets);
    set.add(45);
    set.add(60);
    return Array.from(set).sort((a, b) => a - b).slice(0, 4);
  }, [presets]);

  const startFocused = () => {
    setFocused(true);
    onStart();
  };

  const stop = () => {
    if (elapsed >= 60) onFinish();
    else onDiscard();
    setFocused(false);
  };

  return (
    <>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3.5">
          <div>
            <h2 className="text-[14.5px] font-semibold text-ink">Focus session</h2>
            <p className="text-[11.5px] text-ink3">
              {active ? 'Timer running — stay in the zone' : 'Start a timer or log instantly'}
            </p>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              status === 'running'
                ? 'bg-emerald-500/15 text-emerald-300'
                : status === 'paused'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-surface3 text-ink3'
            }`}
          >
            {status === 'running' && <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />}
            {status === 'running' ? 'LIVE' : status === 'paused' ? 'PAUSED' : 'READY'}
          </span>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-[42px] font-bold leading-none tabular-nums tracking-tight text-ink">
              {formatDuration(elapsed)}
            </span>
          </div>

          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {subjects.map((s) => (
              <Chip key={s.id} active={subjectId === s.id} onClick={() => onSelectSubject(s.id)}>
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </Chip>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {status === 'running' ? (
              <CustomButton variant="outline" onClick={onPause} leadingIcon={<Pause className="size-4" />}>
                Pause
              </CustomButton>
            ) : (
              <CustomButton
                variant={status === 'paused' ? 'tonal' : 'primary'}
                onClick={startFocused}
                leadingIcon={<Play className="size-4" />}
              >
                {status === 'paused' ? 'Resume' : 'Start'}
              </CustomButton>
            )}
            <CustomButton
              variant="success"
              disabled={elapsed < 60}
              onClick={() => { onFinish(); setFocused(false); }}
              leadingIcon={<Save className="size-4" />}
            >
              Save
            </CustomButton>
            <CustomButton
              variant="ghost"
              disabled={!active}
              onClick={() => { onDiscard(); setFocused(false); }}
              leadingIcon={active ? <RotateCcw className="size-4" /> : <Square className="size-4" />}
            >
              Reset
            </CustomButton>
          </div>

          <div className="border-t border-hairline pt-3">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink3">
                Quick log for{' '}
                <span className="font-bold" style={{ color: subject?.color ?? '#f59e0b' }}>
                  {subject?.name ?? 'Subject'}
                </span>
              </p>
              <span className="size-2 rounded-full" style={{ background: subject?.color ?? '#f59e0b' }} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {quickPresets.map((minutes) => (
                <Chip
                  key={minutes}
                  onClick={() => onQuickLog(minutes)}
                  className="h-10 w-full justify-center px-0 transition-all hover:scale-105 active:scale-95"
                >
                  +{minutes}m
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Distraction-free focus mode: timer + pause + stop only ── */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-10 bg-surface px-8"
          >
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 }}
              className="flex flex-col items-center gap-2">
              <span className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-bold"
                style={{ background: (subject?.color ?? '#f59e0b') + '22', color: subject?.color ?? '#f59e0b' }}>
                <span className="size-2 rounded-full" style={{ background: subject?.color ?? '#f59e0b' }} />
                {subject?.name ?? 'Study'}
              </span>
              {status === 'paused' && (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-300">PAUSED</span>
              )}
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 20 }}>
              <CircularProgress
                value={Math.min(1, elapsed / (defaultSessionMin * 60))}
                size={250} thickness={18}
                from="#f59e0b" to="#fb923c" gradientId="focus-ring"
                trackClassName="stroke-white/8"
              >
                <div className="text-center">
                  <p className="text-[46px] font-bold leading-none tabular-nums tracking-tight text-ink">
                    {formatDuration(elapsed)}
                  </p>
                  <p className="mt-2 text-[12px] font-semibold text-ink3">
                    target {formatMinutes(defaultSessionMin)}
                  </p>
                </div>
              </CircularProgress>
            </motion.div>

            <div className="flex items-center gap-5">
              <motion.button
                type="button"
                aria-label={status === 'running' ? 'Pause' : 'Resume'}
                whileTap={{ scale: 0.9 }}
                onClick={() => (status === 'running' ? onPause() : onStart())}
                className="grid size-20 place-items-center rounded-full bg-surface2 ring-1 ring-white/10 text-ink shadow-xl"
              >
                {status === 'running' ? <Pause className="size-8" /> : <Play className="size-8 ml-1" />}
              </motion.button>
              <motion.button
                type="button"
                aria-label="Stop session"
                whileTap={{ scale: 0.9 }}
                onClick={stop}
                className="grid size-20 place-items-center rounded-full bg-red-500/15 ring-1 ring-red-500/40 text-red-400 shadow-xl"
              >
                <StopCircle className="size-8" />
              </motion.button>
            </div>

            <p className="text-[11.5px] text-ink3">
              {elapsed >= 60
                ? 'Stop saves this session'
                : 'Stop before 1 minute discards the session'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
