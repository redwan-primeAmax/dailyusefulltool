import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Clock, Flame, Pause, Play, RotateCcw, Square, Wind, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useSettings } from '../../hooks/useTracker';
import { readAll, writeRecord } from '../../db/indexedDB';
import { uid } from '../../utils/format';
import { toDateKey, relativeTime } from '../../utils/date';
import {
  DEFAULT_BREATHE, DEFAULT_BREATHE_PATTERNS, SETTINGS_KEYS, STORE_BREATHE_SESSIONS,
  type BreatheSession, type BreatheSettings,
} from '../../db/trackerService';
import { TECHNIQUES, cycleSeconds, patternToTechnique, type Technique } from './techniques';
import { useBreathingSession } from './useBreathingSession';
import { BreathingRing } from './components/BreathingRing';
import { PhaseCue } from './components/PhaseCue';

type View = 'library' | 'session';

export function BreatheApp() {
  const { openScreen } = useOS();
  const { settings } = useSettings<BreatheSettings>(SETTINGS_KEYS.breathe, DEFAULT_BREATHE);

  const library = useMemo<Technique[]>(() => {
    const builtinNames = new Set(TECHNIQUES.map((t) => t.name.toLowerCase()));
    const custom = (settings.patterns.length > 0 ? settings.patterns : DEFAULT_BREATHE_PATTERNS)
      .map(patternToTechnique)
      .filter((t) => !builtinNames.has(t.name.toLowerCase()));
    return [...TECHNIQUES, ...custom];
  }, [settings.patterns]);

  const [selected, setSelected] = useState<Technique | null>(null);
  const [view, setView] = useState<View>('library');
  const [history, setHistory] = useState<BreatheSession[]>([]);

  useEffect(() => {
    readAll<BreatheSession>(STORE_BREATHE_SESSIONS)
      .then((rows) => setHistory(rows.sort((a, b) => b.ts - a.ts).slice(0, 30)));
  }, []);

  return (
    <AnimatePresence mode="wait">
      {view === 'session' && selected ? (
        <SessionView
          key={selected.id}
          technique={selected}
          onClose={() => { setView('library'); setSelected(null); }}
          onSaveSession={(entry) => setHistory((prev) => [entry, ...prev].slice(0, 30))}
        />
      ) : (
        <LibraryView
          key="library"
          library={library}
          history={history}
          onOpen={(t) => { setSelected(t); setView('session'); }}
          onSettings={() => openScreen('breathe', 'settings')}
        />
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Library                                                           */
/* ══════════════════════════════════════════════════════════════════ */

function LibraryView({
  library, history, onOpen, onSettings,
}: {
  library: Technique[];
  history: BreatheSession[];
  onOpen: (t: Technique) => void;
  onSettings: () => void;
}) {
  const totalSessions = history.length;
  const totalMinutes = Math.round(history.reduce((s, h) => s + h.seconds, 0) / 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="relative flex h-full flex-col overflow-hidden bg-[#080b12]"
    >
      {/* Ambient aurora */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div className="absolute -left-24 -top-24 size-72 rounded-full bg-teal-500/15 blur-[80px]"
          animate={{ x: [0, 24, 0], y: [0, 18, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -right-24 top-40 size-80 rounded-full bg-sky-500/12 blur-[90px]"
          animate={{ x: [0, -20, 0], y: [0, 24, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
      </div>

      <div className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-28 pt-6">
        {/* Hero header */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 text-white shadow-lg shadow-teal-500/30">
                <Wind className="size-5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-teal-300/70">Breathe</span>
            </div>
            <h1 className="text-[30px] font-extralight leading-[1.05] tracking-tight text-white">
              Find your<br /><span className="font-semibold">calm rhythm</span>
            </h1>
          </div>
          <button
            type="button" onClick={onSettings} aria-label="Breathe settings"
            className="tap grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </header>

        {/* Stat strip */}
        {totalSessions > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <StatChip icon={<Flame className="size-4 text-orange-400" />} value={`${totalSessions}`} label="sessions" />
            <StatChip icon={<Clock className="size-4 text-sky-400" />} value={`${totalMinutes}m`} label="total time" />
          </div>
        )}

        {/* Featured technique */}
        <FeaturedCard technique={library[0]} onOpen={onOpen} />

        {/* Technique grid */}
        <p className="mb-3 mt-7 px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
          All techniques
        </p>
        <div className="grid grid-cols-2 gap-3">
          {library.slice(1).map((tech, i) => (
            <TechniqueCard key={tech.id} technique={tech} index={i} onOpen={onOpen} />
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <>
            <p className="mb-3 mt-7 px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
              Recent sessions
            </p>
            <div className="overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.03]">
              <ul className="divide-y divide-white/6">
                {history.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-[15px]">🫧</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">{s.patternName}</p>
                      <p className="text-[10.5px] text-white/40">{relativeTime(s.ts)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12.5px] font-bold text-white">{s.cycles} cycles</p>
                      <p className="text-[10px] text-white/40">{Math.floor(s.seconds / 60)}m {s.seconds % 60}s</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="grid size-9 place-items-center rounded-xl bg-white/6">{icon}</span>
      <div>
        <p className="text-[18px] font-bold leading-none text-white">{value}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
      </div>
    </div>
  );
}

function FeaturedCard({ technique, onOpen }: { technique: Technique; onOpen: (t: Technique) => void }) {
  if (!technique) return null;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(technique)}
      className="relative w-full overflow-hidden rounded-[28px] p-6 text-left shadow-2xl"
      style={{ background: `linear-gradient(135deg, ${technique.color}, ${technique.color2})` }}
    >
      {/* animated shimmer orbs */}
      <motion.span className="pointer-events-none absolute -right-6 -top-10 size-40 rounded-full bg-white/20 blur-2xl"
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.12, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <div className="relative">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          ✦ Recommended
        </span>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[26px] font-bold leading-tight text-white drop-shadow-sm">{technique.name}</p>
            <p className="mt-1 text-[13px] font-semibold text-white/80">{technique.tagline} · {technique.benefit}</p>
          </div>
          <span className="text-[46px] leading-none drop-shadow">{technique.emoji}</span>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-black text-slate-900 shadow-lg">
            <Play className="size-3.5 fill-current" /> Begin
          </span>
          <span className="text-[11px] font-semibold text-white/70">~{Math.round(cycleSeconds(technique))}s / cycle</span>
        </div>
      </div>
    </motion.button>
  );
}

function TechniqueCard({ technique, index, onOpen }: { technique: Technique; index: number; onOpen: (t: Technique) => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), type: 'spring', stiffness: 260, damping: 22 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => onOpen(technique)}
      className="group relative flex h-[152px] flex-col justify-between overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-left"
    >
      {/* gradient wash on the top corner */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${technique.color}, ${technique.color2})`, opacity: 0.35 }} />
      <div className="relative flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl text-[22px] shadow-inner"
          style={{ background: `linear-gradient(135deg, ${technique.color}33, ${technique.color2}22)` }}>
          {technique.emoji}
        </span>
        <ChevronRight className="size-4 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
      </div>
      <div className="relative">
        <p className="text-[14px] font-bold leading-tight text-white">{technique.name}</p>
        <p className="mt-0.5 text-[11px] font-bold" style={{ color: technique.color }}>{technique.tagline}</p>
        <p className="mt-1.5 line-clamp-1 text-[10px] text-white/40">{technique.benefit}</p>
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Session (immersive)                                               */
/* ══════════════════════════════════════════════════════════════════ */

function SessionView({
  technique, onClose, onSaveSession,
}: {
  technique: Technique;
  onClose: () => void;
  onSaveSession: (entry: BreatheSession) => void;
}) {
  const session = useBreathingSession(technique);
  const { notify } = useOS();
  const active = session.status !== 'idle';

  const persistFinish = (payload: { cycles: number; seconds: number }) => {
    if (payload.cycles < 1 && payload.seconds < 10) return;
    const entry: BreatheSession = {
      id: uid(), ts: Date.now(), dateKey: toDateKey(new Date()),
      patternId: technique.id, patternName: technique.name,
      cycles: payload.cycles, seconds: payload.seconds,
    };
    void writeRecord(STORE_BREATHE_SESSIONS, entry as unknown as { id: string });
    onSaveSession(entry);
    notify({ title: 'Session saved', description: `${technique.name} · ${payload.cycles} cycles`, tone: 'success' });
  };

  const steps = technique.guided ? technique.phases.map((p) => p.hint ?? p.label) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: `radial-gradient(130% 100% at 50% 0%, ${technique.color}22, #06080e 62%)` }}
    >
      {/* deep ambient glow that pulses with the breath */}
      <motion.div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: `linear-gradient(135deg, ${technique.color}, ${technique.color2})` }}
        animate={active
          ? { opacity: session.phase?.kind === 'inhale' ? 0.32 : session.phase?.kind === 'exhale' ? 0.12 : 0.22, scale: session.phase?.targetScale ?? 1 }
          : { opacity: 0.14, scale: 1 }}
        transition={{ duration: Math.max(1, session.phase?.seconds ?? 4), ease: 'easeInOut' }}
      />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-5">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold text-white">{technique.name}</p>
          <p className="text-[11px] font-semibold text-white/50">{technique.tagline}</p>
        </div>
        <button
          type="button"
          onClick={() => { if (active) session.stop(persistFinish); onClose(); }}
          aria-label="Close session"
          className="tap grid size-10 place-items-center rounded-full border border-white/10 bg-white/8 text-white/70 backdrop-blur"
        >
          {active ? <Square className="size-4" /> : <X className="size-5" />}
        </button>
      </div>

      {/* Center stage */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-10 px-6">
        <PhaseCue
          phase={session.phase}
          status={session.status}
          cycles={session.cycles}
          color={technique.color}
          steps={steps}
          stepIndex={session.phaseIndex}
        />

        <BreathingRing
          color={technique.color}
          kind={session.phase?.kind ?? 'inhale'}
          secondsLeft={session.secondsLeft}
          progress={session.phaseProgress}
          targetScale={session.phase?.targetScale ?? 1}
          duration={session.phase?.seconds ?? 4}
          totalSeconds={session.totalSeconds}
          active={active}
        />

        {/* Phase timeline */}
        <div className="flex w-full max-w-[300px] justify-center gap-1.5">
          {technique.phases.map((p, i) => {
            const isCurrent = session.phaseIndex === i && active;
            return (
              <div key={i} className="flex-1 text-center">
                <div className="mb-1 h-1 rounded-full transition-all"
                  style={{ background: isCurrent ? technique.color : 'rgba(255,255,255,0.12)' }} />
                <p className="text-[11px] font-bold tabular-nums" style={{ color: isCurrent ? technique.color : 'rgba(255,255,255,0.4)' }}>
                  {p.seconds}s
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls dock */}
      <div className="relative z-20 flex items-center justify-center gap-6 px-6 pb-10 pt-4">
        <motion.button
          type="button" whileTap={{ scale: 0.88 }} onClick={session.reset}
          aria-label="Reset"
          className="grid size-12 place-items-center rounded-full border border-white/10 bg-white/8 text-white/70 backdrop-blur"
        >
          <RotateCcw className="size-5" />
        </motion.button>

        <motion.button
          type="button" whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (session.status === 'running') session.togglePause();
            else session.startOrResume();
          }}
          aria-label={session.status === 'running' ? 'Pause' : 'Start'}
          className="relative grid size-20 place-items-center rounded-full text-white"
          style={{
            background: `linear-gradient(135deg, ${technique.color}, ${technique.color2})`,
            boxShadow: `0 14px 44px -8px ${technique.color}88`,
          }}
        >
          {session.status === 'running' && (
            <motion.span className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${technique.color}` }}
              animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
          )}
          {session.status === 'running' ? <Pause className="size-8" /> : <Play className="size-8 ml-1" />}
        </motion.button>

        <div className="grid size-12 place-items-center rounded-full border border-white/10 bg-white/8 text-[15px] font-bold text-white backdrop-blur">
          {session.cycles}
        </div>
      </div>
    </motion.div>
  );
}
