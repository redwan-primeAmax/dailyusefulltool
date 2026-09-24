import { AnimatePresence, motion } from 'framer-motion';
import type { BreathPhase } from '../techniques';
import type { SessionStatus } from '../useBreathingSession';
import { cn } from '../../../utils/cn';

export interface PhaseCueProps {
  phase: BreathPhase | null;
  status: SessionStatus;
  cycles: number;
  color: string;
  steps?: string[];
  stepIndex?: number;
}

/** Live instruction block: big label, guidance, step trail, cycle counter. */
export function PhaseCue({ phase, status, cycles, color, steps, stepIndex }: PhaseCueProps) {
  const running = status === 'running' || status === 'paused';
  const key = phase ? `${phase.kind}-${phase.label}` : 'idle';

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {running && (
        <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/40">
          Cycle {cycles + 1}
        </span>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.24 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          {phase ? (
            <>
              <p className="text-[30px] font-light leading-none tracking-tight text-white">
                {phase.label}
              </p>
              <p className="max-w-[300px] text-[13px] font-medium leading-relaxed text-white/55">
                {phase.instruction}
              </p>
            </>
          ) : (
            <>
              <p className="text-[30px] font-light leading-none tracking-tight text-white">Ready</p>
              <p className="text-[13px] font-medium text-white/45">Press start when you're settled</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Step trail for guided techniques */}
      {steps && steps.length > 0 && (
        <div className="no-scrollbar mt-1 flex max-w-full gap-1.5 overflow-x-auto px-4 pb-0.5">
          {steps.map((step, i) => {
            const active = i === stepIndex && running;
            return (
              <span
                key={`${step}-${i}`}
                className={cn(
                  'flex h-7 shrink-0 items-center rounded-full px-3 text-[10px] font-bold transition-colors',
                  active ? 'text-slate-900' : 'bg-white/6 text-white/45',
                )}
                style={active ? { background: color } : undefined}
              >
                {step}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
