import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gamepad2, Play, RotateCcw, Sigma, Trophy, Zap, Check, X, Target, Gauge, BarChart3 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { Stepper, Segmented, Toggle } from '../../components/ui/controls';
import { CustomButton } from '../../components/CustomButton';
import { useOS } from '../../context/OSContext';
import { useSettings } from '../../hooks/useTracker';
import { SETTINGS_KEYS } from '../../db/trackerService';
import { cn } from '../../utils/cn';

/* ════════════════════════════════════════════════════════════════ */
/*  MEMORY MATCH                                                     */
/* ════════════════════════════════════════════════════════════════ */

const EMOJIS = ['🍎', '🚀', '🌵', '🎧', '', '', '⚽', '🦋', '🌙', '⚡', '🍀', ''];

type Difficulty = 'easy' | 'medium' | 'hard';
const MEMORY_DIFF: Record<Difficulty, { pairs: number; cols: number; label: string; desc: string }> = {
  easy: { pairs: 4, cols: 4, label: 'Easy', desc: '4 pairs · 8 cards' },
  medium: { pairs: 6, cols: 4, label: 'Medium', desc: '6 pairs · 12 cards' },
  hard: { pairs: 9, cols: 6, label: 'Hard', desc: '9 pairs · 18 cards' },
};

interface MemorySettings { difficulty: Difficulty; best: Partial<Record<Difficulty, number>> }
const DEFAULT_MEMORY: MemorySettings = { difficulty: 'medium', best: {} };

interface Card { id: number; emoji: string; matched: boolean }

export function MemoryGame() {
  const { openScreen, notify } = useOS();
  const { settings } = useSettings<MemorySettings>(SETTINGS_KEYS.memory, DEFAULT_MEMORY);
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);
  const best = settings.best[settings.difficulty];

  const diff = MEMORY_DIFF[settings.difficulty];

  const deal = (d: Difficulty = settings.difficulty) => {
    const { pairs } = MEMORY_DIFF[d];
    const pool = [...new Set(EMOJIS.filter((e) => e.length > 0))].sort(() => Math.random() - 0.5).slice(0, pairs);
    const deck = [...pool, ...pool]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    lock.current = false;
    setStarted(true);
  };

  const won = started && cards.length > 0 && cards.every((c) => c.matched);

  const flip = (idx: number) => {
    if (lock.current || flipped.includes(idx) || cards[idx].matched) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lock.current = true;
      const [a, b] = next;
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
          setFlipped([]);
          lock.current = false;
        }, 350);
      } else {
        setTimeout(() => { setFlipped([]); lock.current = false; }, 750);
      }
    }
  };

  useEffect(() => {
    if (!won) return;
    const d = settings.difficulty;
    if (best === undefined || moves < best) {
      void updateBest(d, moves);
    }
    notify({ title: '🎉 Board cleared!', description: `${moves} moves · ${MEMORY_DIFF[d].label}`, tone: 'success' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const { update: memUpdate } = useSettings<MemorySettings>(SETTINGS_KEYS.memory, DEFAULT_MEMORY);
  const updateBest = (d: Difficulty, v: number) =>
    memUpdate({ best: { ...settings.best, [d]: v } });

  if (!started) {
    return (
      <ScreenShell title="Memory Match" subtitle="Choose a difficulty to start"
        icon={<Gamepad2 className="size-[19px]" />}
        onOpenSettings={() => openScreen('memory', 'settings')}
        contentClassName="!space-y-4 items-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="grid size-24 place-items-center rounded-[30px] bg-gradient-to-br from-teal-400/25 to-cyan-600/25 text-5xl ring-1 ring-white/10">
          🧠
        </motion.div>
        <p className="max-w-[260px] text-center text-[13px] leading-relaxed text-ink2">
          Flip the cards and match every pair. Fewer moves = a sharper mind.
        </p>
        <div className="w-full space-y-2.5">
          {(Object.keys(MEMORY_DIFF) as Difficulty[]).map((d, i) => {
            const cfg = MEMORY_DIFF[d];
            const b = settings.best[d];
            return (
              <motion.button key={d} type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (settings.difficulty !== d) memUpdate({ difficulty: d });
                  setTimeout(() => deal(d), 50);
                }}
                className={cn('card flex w-full items-center gap-3 p-4 text-left transition-all',
                  settings.difficulty === d && 'ring-2 ring-teal-400/60')}>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-500/15 text-xl">
                  {d === 'easy' ? '' : d === 'medium' ? '🦉' : '🧠'}
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-bold text-ink">{cfg.label}</span>
                  <span className="block text-[11.5px] text-ink3">{cfg.desc}</span>
                </span>
                {b !== undefined && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                    <Trophy className="size-3" /> {b}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Memory Match" subtitle={`${MEMORY_DIFF[settings.difficulty].label} · ${moves} moves${best !== undefined ? ` · best ${best}` : ''}`}
      icon={<Gamepad2 className="size-[19px]" />}
      onOpenSettings={() => openScreen('memory', 'settings')}
      contentClassName="!space-y-4 items-center">
      <div className={cn('grid w-full gap-2.5', diff.cols === 6 ? 'grid-cols-6' : 'grid-cols-4')}>
        {cards.map((card, i) => {
          const up = flipped.includes(i) || card.matched;
          return (
            <motion.button key={card.id} type="button" onClick={() => flip(i)}
              whileTap={{ scale: 0.92 }}
              className="relative aspect-square [perspective:600px]">
              <motion.div animate={{ rotateY: up ? 180 : 0 }} transition={{ duration: 0.35 }}
                className="absolute inset-0 [transform-style:preserve-3d]">
                <div className="absolute inset-0 grid place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-teal-500/30 to-cyan-600/30 text-base font-bold text-white/50 [backface-visibility:hidden] sm:text-xl">
                  ?
                </div>
                <div className={cn('absolute inset-0 grid place-items-center rounded-xl text-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] sm:text-3xl',
                  card.matched ? 'bg-emerald-500/25 ring-2 ring-emerald-400/50' : 'bg-surface2 ring-1 ring-white/10')}>
                  {card.emoji}
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {won && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="card flex w-full items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Trophy className="size-6 text-amber-400" />
              <div>
                <p className="text-[15px] font-bold text-ink">You won!</p>
                <p className="text-[11.5px] text-ink3">{moves} moves{best !== undefined ? ` · best ${best}` : ''}</p>
              </div>
            </div>
            <CustomButton onClick={() => deal()} leadingIcon={<RotateCcw className="size-4" />}>
              Play again
            </CustomButton>
          </motion.div>
        )}
      </AnimatePresence>

      {!won && (
        <div className="flex w-full gap-2">
          <CustomButton variant="tonal" fullWidth onClick={() => deal()} leadingIcon={<RotateCcw className="size-4" />}>
            Shuffle & restart
          </CustomButton>
          <CustomButton variant="outline" onClick={() => { setStarted(false); setCards([]); }}>
            Change
          </CustomButton>
        </div>
      )}
    </ScreenShell>
  );
}

export function MemorySettings() {
  const { settings, update } = useSettings<MemorySettings>(SETTINGS_KEYS.memory, DEFAULT_MEMORY);
  const resetBest = () => update({ best: {} });
  return (
    <ScreenShell title="Memory settings" subtitle="Difficulty & best scores" icon={<Gamepad2 className="size-[19px]" />} contentClassName="space-y-5">
      <SettingsGroup title="Board">
        <SettingsRow icon={<Gamepad2 className="size-[17px]" />} label="Default difficulty"
          description={MEMORY_DIFF[settings.difficulty].desc}
          control={
            <Segmented className="w-[180px]" size="sm" ariaLabel="difficulty" value={settings.difficulty}
              onChange={(difficulty) => update({ difficulty })}
              options={[
                { value: 'easy' as Difficulty, label: 'Easy' },
                { value: 'medium' as Difficulty, label: 'Med' },
                { value: 'hard' as Difficulty, label: 'Hard' },
              ]} />
          } />
      </SettingsGroup>
      <SettingsGroup title="Best scores">
        {(Object.keys(MEMORY_DIFF) as Difficulty[]).map((d) => (
          <SettingsRow key={d} label={MEMORY_DIFF[d].label}
            description={settings.best[d] !== undefined ? `Best: ${settings.best[d]} moves` : 'No record yet'}
            control={
              settings.best[d] !== undefined && (
                <button type="button" onClick={resetBest} className="tap text-[11px] font-bold text-red-400/80 hover:text-red-400">Reset all</button>
              )
            } />
        ))}
      </SettingsGroup>
      <section className="pb-2 text-center text-[11.5px] text-ink3">Memory Match · v1.1.0</section>
    </ScreenShell>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  MATH DASH                                                        */
/* ════════════════════════════════════════════════════════════════ */

type Op = '+' | '−' | '×' | '÷';
const OPS: Op[] = ['+', '−', '×', '÷'];
const OP_COLORS: Record<Op, string> = {
  '+': 'from-emerald-400 to-teal-500',
  '−': 'from-sky-400 to-blue-500',
  '×': 'from-amber-400 to-orange-500',
  '÷': 'from-cyan-400 to-sky-500',
};

interface MathSettings {
  seconds: number;
  pointsPerCorrect: number;
  enabledOps: Record<Op, boolean>;
  /** per-operation statistics: [attempts, correct, totalResponseMs] */
  stats: Record<Op, [number, number, number]>;
  totalCorrect: number;
  totalAttempts: number;
  totalTimeMs: number;
}
const DEFAULT_MATH: MathSettings = {
  seconds: 45,
  pointsPerCorrect: 1,
  enabledOps: { '+': true, '−': true, '×': true, '÷': true },
  stats: { '+': [0, 0, 0], '−': [0, 0, 0], '×': [0, 0, 0], '÷': [0, 0, 0] },
  totalCorrect: 0,
  totalAttempts: 0,
  totalTimeMs: 0,
};

interface Problem { a: number; b: number; op: Op; answer: number; options: number[] }

function makeProblem(enabled: Record<Op, boolean>): Problem | null {
  const pool = OPS.filter((o) => enabled[o]);
  if (pool.length === 0) return null;
  const op = pool[Math.floor(Math.random() * pool.length)];
  if (op === '÷') {
    const b = 2 + Math.floor(Math.random() * 9);
    const answer = 2 + Math.floor(Math.random() * 12);
    const a = b * answer;
    const options = shuffle([answer, answer + 1, answer - 1, answer + 2]).slice(0, 4);
    return { a, b, op, answer, options: dedupe(options) };
  }
  const max = op === '×' ? 12 : 25;
  let a = 1 + Math.floor(Math.random() * max);
  let b = 1 + Math.floor(Math.random() * max);
  if (op === '−' && b > a) [a, b] = [b, a];
  const answer = op === '+' ? a + b : op === '−' ? a - b : a * b;
  const opts = new Set<number>([answer]);
  while (opts.size < 4) opts.add(Math.max(0, answer + (Math.floor(Math.random() * 9) - 4) || 1));
  return { a, b, op, answer, options: shuffle([...opts]) };
}
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }
function dedupe(nums: number[]): number[] { return [...new Set(nums)]; }

export function MathDash() {
  const { openScreen } = useOS();
  const { settings, update } = useSettings<MathSettings>(SETTINGS_KEYS.mathdash, DEFAULT_MATH);
  const [screen, setScreen] = useState<'start' | 'play' | 'done'>('start');
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.seconds);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [feedback, setFeedback] = useState<null | { value: number; correct: boolean }>(null);
  const [lastDeltas, setLastDeltas] = useState<{ op: Op; correct: boolean; ms: number }[]>([]);
  const questionAt = useRef(0);

  const start = () => {
    setScore(0); setStreak(0); setBestStreak(0);
    setTimeLeft(settings.seconds);
    setLastDeltas([]);
    const p = makeProblem(settings.enabledOps);
    setProblem(p);
    questionAt.current = Date.now();
    setFeedback(null);
    setScreen('play');
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? (setRunning(false), setScreen('done'), 0) : t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const pick = (value: number) => {
    if (!running || !problem || feedback) return;
    const ms = Date.now() - questionAt.current;
    const correct = value === problem.answer;
    setFeedback({ value, correct });
    setLastDeltas((d) => [...d.slice(-40), { op: problem.op, correct, ms }]);
    update({
      stats: {
        ...settings.stats,
        [problem.op]: [
          settings.stats[problem.op][0] + 1,
          settings.stats[problem.op][1] + (correct ? 1 : 0),
          settings.stats[problem.op][2] + ms,
        ],
      },
      totalAttempts: settings.totalAttempts + 1,
      totalCorrect: settings.totalCorrect + (correct ? 1 : 0),
      totalTimeMs: settings.totalTimeMs + ms,
    });
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      const bonus = newStreak >= 3 ? Math.floor(newStreak / 3) : 0;
      setScore((s) => s + settings.pointsPerCorrect + bonus);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      const next = makeProblem(settings.enabledOps);
      if (!next) { setRunning(false); setScreen('done'); return; }
      setProblem(next);
      questionAt.current = Date.now();
      setFeedback(null);
    }, 260);
  };

  const low = timeLeft <= 5 && running;

  /* ── Start screen ── */
  if (screen === 'start') {
    return (
      <ScreenShell title="Math Dash" subtitle="Rapid arithmetic · all four operations"
        icon={<Sigma className="size-[19px]" />}
        onOpenSettings={() => openScreen('mathdash', 'settings')}
        contentClassName="!space-y-5 items-center">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          className="grid size-24 place-items-center rounded-[30px] bg-gradient-to-br from-amber-400/25 to-orange-600/25 ring-1 ring-white/10">
          <Sigma className="size-11 text-amber-300" />
        </motion.div>
        <p className="max-w-[270px] text-center text-[13px] leading-relaxed text-ink2">
          Answer as many as you can before the clock runs out. Streaks of 3+ earn bonus points.
        </p>
        <div className="flex w-full items-center justify-center gap-2">
          {OPS.map((op) => (
            <span key={op} className={cn('grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-xl font-black text-white/90 shadow',
              settings.enabledOps[op] ? OP_COLORS[op] : 'from-zinc-700 to-zinc-800 opacity-40')}>
              {op}
            </span>
          ))}
        </div>
        <div className="grid w-full grid-cols-3 gap-3">
          <MiniStat label="Timer" value={`${settings.seconds}s`} />
          <MiniStat label="Points" value={`+${settings.pointsPerCorrect}`} />
          <MiniStat label="Rounds" value={`${settings.totalAttempts}`} />
        </div>
        <CustomButton size="lg" fullWidth onClick={start} leadingIcon={<Play className="size-5" />}>
          Start the dash
        </CustomButton>
      </ScreenShell>
    );
  }

  /* ── Report / done screen ── */
  if (screen === 'done') {
    const acc = lastDeltas.length ? Math.round((lastDeltas.filter((d) => d.correct).length / lastDeltas.length) * 100) : 0;
    return (
      <ScreenShell title="Math Dash" subtitle="Round complete"
        icon={<Sigma className="size-[19px]" />}
        onOpenSettings={() => openScreen('mathdash', 'settings')}
        contentClassName="!space-y-4 items-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/30">
          <Zap className="size-9" />
        </motion.div>
        <p className="text-[40px] font-black leading-none text-ink">{score}<span className="text-[16px] text-ink3"> pts</span></p>
        <div className="grid w-full grid-cols-3 gap-3">
          <MiniStat label="Accuracy" value={`${acc}%`} />
          <MiniStat label="Best streak" value={`${bestStreak}`} />
          <MiniStat label="Questions" value={`${lastDeltas.length}`} />
        </div>
        <div className="card w-full p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Target className="size-3.5" /> This round
          </p>
          <div className="grid grid-cols-4 gap-2">
            {OPS.map((op) => {
              const d = lastDeltas.filter((x) => x.op === op);
              const c = d.filter((x) => x.correct).length;
              return (
                <div key={op} className="rounded-xl bg-surface3/50 p-2 text-center">
                  <p className="text-[13px] font-black text-ink">{op}</p>
                  <p className="text-[10.5px] font-bold text-ink2">{c}/{d.length || 0}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex w-full gap-2">
          <CustomButton fullWidth size="lg" onClick={start} leadingIcon={<RotateCcw className="size-4" />}>
            Play again
          </CustomButton>
          <CustomButton variant="tonal" onClick={() => setScreen('start')}>
            Home
          </CustomButton>
        </div>
      </ScreenShell>
    );
  }

  /* ── Play screen ── */
  return (
    <ScreenShell title="Math Dash" subtitle={`+${settings.pointsPerCorrect}/correct · streak bonus at 3+`}
      icon={<Sigma className="size-[19px]" />}
      onOpenSettings={() => openScreen('mathdash', 'settings')}
      contentClassName="!space-y-5 items-center">
      <div className="flex w-full items-center justify-between">
        <motion.span key={timeLeft} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
          className={cn('text-[30px] font-black tabular-nums', low ? 'text-red-400 animate-pulse' : 'text-ink')}>
          {timeLeft}s
        </motion.span>
        <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-black tabular-nums',
          streak >= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-surface3 text-ink')}>
          <Zap className={cn('size-4', streak >= 3 && 'text-amber-400')} /> {score}
        </span>
      </div>

      {streak >= 3 && (
        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="text-[12px] font-black text-amber-400">🔥 {streak} streak — bonus active</motion.p>
      )}

      {problem && (
        <motion.div key={problem.a + problem.b + problem.op}
          initial={{ opacity: 0, scale: 0.86, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className={cn('w-full rounded-[26px] bg-gradient-to-br p-[2px] shadow-xl', OP_COLORS[problem.op])}>
          <div className="grid w-full place-items-center rounded-[24px] bg-surface px-6 py-12">
            <p className="text-[46px] font-light tabular-nums tracking-tight text-ink">
              {problem.a} <span className={cn('bg-gradient-to-r bg-clip-text text-transparent', OP_COLORS[problem.op])}>{problem.op}</span> {problem.b}
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid w-full grid-cols-2 gap-3">
        {problem && problem.options.map((opt) => (
          <motion.button key={`${problem.a}-${opt}`} type="button" whileTap={{ scale: 0.94 }}
            onClick={() => pick(opt)} disabled={!!feedback}
            className={cn('rounded-2xl py-5 text-[22px] font-black tabular-nums transition-colors',
              feedback && opt === problem.answer ? 'bg-emerald-500 text-white'
              : feedback && opt === feedback.value && !feedback.correct ? 'bg-red-500 text-white'
              : 'bg-surface2 text-ink ring-1 ring-white/10')}>
            {opt}
          </motion.button>
        ))}
      </div>
    </ScreenShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-3 text-center">
      <p className="text-[16px] font-black text-ink">{value}</p>
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-ink3">{label}</p>
    </div>
  );
}

export function MathSettings() {
  const { notify } = useOS();
  const { settings, update } = useSettings<MathSettings>(SETTINGS_KEYS.mathdash, DEFAULT_MATH);

  const totalAttempts = settings.totalAttempts;
  const overallAcc = totalAttempts ? Math.round((settings.totalCorrect / totalAttempts) * 100) : 0;
  const avgMs = totalAttempts ? Math.round(settings.totalTimeMs / totalAttempts) : 0;

  const perOp = OPS.map((op) => {
    const [attempts, correct, ms] = settings.stats[op];
    return { op, attempts, correct, acc: attempts ? Math.round((correct / attempts) * 100) : null, avg: attempts ? Math.round(ms / attempts) : 0 };
  });
  const withData = perOp.filter((p) => p.attempts > 0);
  const strongest = withData.length ? perOp.reduce((a, b) => ((a.acc ?? 0) >= (b.acc ?? 0) ? a : b)) : null;
  const weakest = withData.length ? perOp.reduce((a, b) => ((a.acc ?? 0) <= (b.acc ?? 0) ? a : b)) : null;

  const clearStats = () => {
    update({
      stats: { '+': [0, 0, 0], '−': [0, 0, 0], '×': [0, 0, 0], '÷': [0, 0, 0] },
      totalCorrect: 0, totalAttempts: 0, totalTimeMs: 0,
    });
    notify({ title: 'Report card cleared', tone: 'info' });
  };

  return (
    <ScreenShell title="Math Dash settings" subtitle="Rules, timer & report card" icon={<Sigma className="size-[19px]" />}
      contentClassName="space-y-5">
      <SettingsGroup title="Round rules">
        <SettingsRow icon={<Gauge className="size-[17px]" />} label="Round length"
          description={`${settings.seconds} seconds per dash`}
          control={<Stepper value={settings.seconds} step={15} min={15} max={180} suffix="s"
            onChange={(seconds) => update({ seconds })} />} />
        <SettingsRow icon={<Zap className="size-[17px]" />} label="Points per correct"
          description="Streak bonuses are added on top"
          control={<Stepper value={settings.pointsPerCorrect} step={1} min={1} max={10}
            onChange={(pointsPerCorrect) => update({ pointsPerCorrect })} />} />
      </SettingsGroup>

      <SettingsGroup title="Operations" description="Toggle which operators appear in questions.">
        <div className="grid grid-cols-2 gap-2 p-4">
          {OPS.map((op) => (
            <div key={op} className={cn('flex items-center justify-between rounded-2xl border p-3',
              settings.enabledOps[op] ? 'border-amber-500/30 bg-amber-500/10' : 'border-hairline bg-surface3/40')}>
              <span className={cn('text-[18px] font-black', settings.enabledOps[op] ? 'text-amber-300' : 'text-ink3')}>{op}</span>
              <Toggle label={`Enable ${op}`} checked={settings.enabledOps[op]}
                onChange={(on) => update({ enabledOps: { ...settings.enabledOps, [op]: on } })} />
            </div>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Report card" description="Your lifetime performance analytics.">
        {totalAttempts === 0 ? (
          <p className="px-4 pb-4 text-[12px] text-ink3">Play a round to start building your report card.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 p-4 pb-0">
              <div className="rounded-2xl bg-surface3/50 p-3 text-center">
                <p className="text-[18px] font-black text-ink">{overallAcc}%</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink3">Accuracy</p>
              </div>
              <div className="rounded-2xl bg-surface3/50 p-3 text-center">
                <p className="text-[18px] font-black text-ink">{(avgMs / 1000).toFixed(1)}s</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink3">Avg response</p>
              </div>
              <div className="rounded-2xl bg-surface3/50 p-3 text-center">
                <p className="text-[18px] font-black text-ink">{totalAttempts}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink3">Questions</p>
              </div>
            </div>
            <div className="space-y-2 p-4">
              {perOp.map((p) => (
                <div key={p.op} className="flex items-center gap-3">
                  <span className="w-6 text-center text-[15px] font-black text-ink">{p.op}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface3">
                    <div className={cn('h-full rounded-full', (p.acc ?? 0) >= 70 ? 'bg-emerald-400' : (p.acc ?? 0) >= 40 ? 'bg-amber-400' : 'bg-red-400')}
                      style={{ width: `${p.acc ?? 0}%` }} />
                  </div>
                  <span className="w-16 text-right text-[11px] font-bold text-ink2">
                    {p.acc !== null ? `${p.acc}% · ${(p.avg / 1000).toFixed(1)}s` : '—'}
                  </span>
                </div>
              ))}
            </div>
            {(strongest || weakest) && (
              <div className="flex gap-2 px-4 pb-4">
                <div className="flex flex-1 items-center gap-2 rounded-2xl bg-emerald-500/10 p-3">
                  <Check className="size-4 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-300">
                    Strongest: <b className="text-[14px]">{strongest?.op}</b>
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-2xl bg-red-500/10 p-3">
                  <X className="size-4 text-red-400" />
                  <span className="text-[11px] font-semibold text-red-300">
                    Practice: <b className="text-[14px]">{weakest?.op}</b>
                  </span>
                </div>
              </div>
            )}
            <SettingsRow icon={<BarChart3 className="size-[17px]" />} label="Overall summary"
              description={`${settings.totalCorrect}/${totalAttempts} correct · ${(avgMs / 1000).toFixed(1)}s average response time`} />
            <SettingsRow danger icon={<RotateCcw className="size-[17px]" />} label="Clear report card"
              description="Resets all lifetime statistics" onClick={clearStats} />
          </>
        )}
      </SettingsGroup>

      <section className="pb-2 text-center text-[11.5px] text-ink3">Math Dash · v2.0.0</section>
    </ScreenShell>
  );
}
