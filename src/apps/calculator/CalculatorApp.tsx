import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Settings, Sigma, Trash2 } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useCalculator } from './useCalculator';
import { CalcDisplay } from './components/CalcDisplay';
import { CalcKeypad } from './components/CalcKeypad';
import { relativeTime } from '../../utils/date';
import { cn } from '../../utils/cn';

/**
 * Calculator shell — chrome-free, native-feeling surface.
 * All arithmetic lives in `calculation.ts`; all state in `useCalculator.ts`.
 */
export function CalculatorApp() {
  const { openScreen } = useOS();
  const calc = useCalculator();
  const [showHistory, setShowHistory] = useState(false);
  const [scientific, setScientific] = useState(false);

  /* Physical keyboard support */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (/^[0-9.]$/.test(k)) calc.append(k);
      else if (k === '+') calc.append('+');
      else if (k === '-') calc.append('-');
      else if (k === '*') calc.append('×');
      else if (k === '/') { e.preventDefault(); calc.append('÷'); }
      else if (k === '(' || k === ')') calc.append(k);
      else if (k === '%') calc.percent();
      else if (k === 'Enter' || k === '=') { e.preventDefault(); calc.equals(); }
      else if (k === 'Backspace') calc.backspace();
      else if (k === 'Escape') calc.clear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [calc]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0a0d14] pb-16">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-20 -top-16 size-64 rounded-full bg-teal-500/10 blur-3xl"
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 -right-16 size-72 rounded-full bg-cyan-500/8 blur-3xl"
          animate={{ opacity: [0.25, 0.5, 0.25], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating controls */}
      <div className="relative z-10 flex items-center justify-end gap-1.5 px-4 pt-4">
        <IconChip
          active={scientific}
          label="Scientific mode"
          onClick={() => setScientific((s) => !s)}
        >
          <Sigma className="size-4" />
        </IconChip>
        <IconChip
          active={showHistory}
          label="History"
          onClick={() => setShowHistory((s) => !s)}
        >
          <History className="size-4" />
        </IconChip>
        <IconChip label="Calculator settings" onClick={() => openScreen('calculator', 'settings')}>
          <Settings className="size-4" />
        </IconChip>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <CalcDisplay
          expression={calc.expression}
          grouped={calc.grouped}
          preview={calc.preview}
          memory={calc.memory}
        />

        {/* History drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 168, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="overflow-hidden border-y border-white/8 bg-white/[0.03]"
            >
              <div className="flex items-center justify-between px-4 pt-2.5">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                  History
                </p>
                {calc.history.length > 0 && (
                  <button
                    type="button"
                    onClick={calc.clearHistory}
                    className="flex items-center gap-1 text-[10.5px] font-bold text-red-400/70 hover:text-red-400"
                  >
                    <Trash2 className="size-3" /> Clear
                  </button>
                )}
              </div>
              <div className="no-scrollbar h-[132px] space-y-0.5 overflow-y-auto px-4 py-2">
                {calc.history.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-white/25">No calculations yet</p>
                ) : (
                  calc.history.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => calc.recallHistory(h)}
                      className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
                    >
                      <span className="min-w-0 flex-1 truncate text-[12px] text-white/45">{h.expression}</span>
                      <span className="shrink-0 text-[13px] font-bold text-white tabular-nums">{h.result}</span>
                      <span className="shrink-0 text-[9.5px] text-white/25">{relativeTime(h.ts)}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CalcKeypad calc={calc} scientific={scientific} />
      </div>
    </div>
  );
}

function IconChip({
  children, label, onClick, active,
}: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'tap grid size-9 place-items-center rounded-full transition-colors',
        active ? 'bg-teal-400/20 text-teal-300' : 'bg-white/6 text-white/45 hover:text-white/80',
      )}
    >
      {children}
    </button>
  );
}
