import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Brain, Timer } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { CircularProgress } from '../../components/CircularProgress';
import { useOS } from '../../context/OSContext';
import { useSettings } from '../../hooks/useTracker';
import { DEFAULT_POMODORO, SETTINGS_KEYS, type PomodoroSettings as PomSettings } from '../../db/trackerService';
import { formatDuration } from '../../utils/format';

type Mode = 'focus' | 'short' | 'long';

const MODE_CONFIG = {
  focus: { label: 'Focus', color: '#ef4444', bg: 'from-red-500 to-orange-500', icon: Brain },
  short: { label: 'Short Break', color: '#22c55e', bg: 'from-emerald-500 to-teal-500', icon: Coffee },
  long:  { label: 'Long Break',  color: '#0ea5e9', bg: 'from-sky-500 to-cyan-500', icon: Coffee },
};

export function PomodoroApp() {
  const { openScreen, notify } = useOS();
  const { settings: pom } = useSettings<PomSettings>(SETTINGS_KEYS.pomodoro, DEFAULT_POMODORO);

  const durations = {
    focus: pom.focusMin * 60,
    short: pom.shortMin * 60,
    long: pom.longMin * 60,
  };

  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(durations.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocus, setTotalFocus] = useState(0);
  const startedAt = useRef<number | null>(null);
  const accumulated = useRef(0);
  const raf = useRef<number>(0);

  // Reset the displayed timer when the active phase's configured duration changes.
  useEffect(() => {
    if (!running) setTimeLeft(durations[mode]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durations.focus, durations.short, durations.long]);

  const reset = useCallback((m: Mode = mode) => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    startedAt.current = null;
    accumulated.current = 0;
    setTimeLeft(durations[m]);
  }, [mode, durations]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    cancelAnimationFrame(raf.current);
    setRunning(false);
    startedAt.current = null;
    accumulated.current = 0;
    setTimeLeft(durations[m]);
  }, [durations]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const base = startedAt.current ? (performance.now() - startedAt.current) / 1000 : 0;
      const elapsed = accumulated.current + base;
      const left = Math.max(0, durations[mode] - elapsed);
      setTimeLeft(Math.ceil(left));
      if (left <= 0) {
        setRunning(false);
        startedAt.current = null;
        accumulated.current = 0;
        if (mode === 'focus') {
          const next = sessions + 1;
          setSessions(next);
          setTotalFocus((t) => t + durations.focus);
          notify({ title: '🍅 Focus session done!', description: 'Take a well-deserved break.', tone: 'success' });
          const nextMode: Mode = next % pom.sessionsBetweenLong === 0 ? 'long' : 'short';
          if (pom.autoAdvance) switchMode(nextMode);
        } else {
          notify({ title: '⏰ Break over!', description: 'Time to focus again.', tone: 'info' });
          if (pom.autoAdvance) switchMode('focus');
        }
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running, mode]);

  const toggle = () => {
    if (running) {
      const base = startedAt.current ? (performance.now() - startedAt.current) / 1000 : 0;
      accumulated.current += base;
      startedAt.current = null;
    } else {
      startedAt.current = performance.now();
    }
    setRunning((r) => !r);
  };

  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;
  const total = durations[mode];
  const progress = total > 0 ? 1 - timeLeft / total : 0;

  return (
    <ScreenShell
      title="Pomodoro"
      subtitle={`${sessions} sessions · ${Math.round(totalFocus / 60)}m focused`}
      icon={<Timer className="size-[19px]" />}
      contentClassName="!space-y-5 items-center"
      onOpenSettings={() => openScreen('pomodoro', 'settings')}
    >
      {/* Mode tabs */}
      <div className="flex w-full gap-1 rounded-2xl border border-hairline bg-surface3/70 p-1">
        {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => (
          <button key={m} type="button" onClick={() => switchMode(m)}
            className={`flex-1 rounded-xl py-2 text-[12px] font-bold transition-all ${mode === m ? `text-white bg-gradient-to-br ${MODE_CONFIG[m].bg}` : 'text-ink3'}`}>
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center gap-6 py-4">
        <CircularProgress value={progress} size={220} thickness={16}
          from={cfg.color} to={cfg.color + 'aa'} gradientId={`pomo-${mode}`}
          celebrate={timeLeft === 0} trackClassName="stroke-white/8">
          <div className="flex flex-col items-center gap-1">
            <Icon className="size-6" style={{ color: cfg.color }} />
            <span className="text-[42px] font-light tabular-nums text-ink leading-none">{formatDuration(timeLeft)}</span>
            <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        </CircularProgress>

        <div className="flex items-center gap-4">
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => reset()}
            className="size-12 rounded-full border border-hairline bg-surface2 grid place-items-center text-ink3 hover:text-ink">
            <RotateCcw className="size-5" />
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={toggle}
            className="size-16 rounded-full grid place-items-center text-white shadow-xl"
            style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}99)` }}>
            {running ? <Pause className="size-7" /> : <Play className="size-7 ml-0.5" />}
          </motion.button>
          <div className="size-12 rounded-full border border-hairline bg-surface2 grid place-items-center">
            <span className="text-[15px] font-bold text-ink">{sessions}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid w-full grid-cols-3 gap-3">
        {[
          { label: 'Sessions', value: sessions },
          { label: 'Focus time', value: `${Math.round(totalFocus / 60)}m` },
          { label: 'Next break', value: (sessions + 1) % pom.sessionsBetweenLong === 0 ? 'Long' : 'Short' },
        ].map((s) => (
          <div key={s.label} className="card py-3 text-center">
            <p className="text-[18px] font-bold text-ink">{s.value}</p>
            <p className="text-[10px] text-ink3 font-semibold uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
