import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, ChevronDown, Brain, Zap, Shield } from 'lucide-react';
import { CHALLENGE_PHASES, type PhaseInfo } from '../addictionModel';
import { ProgressBar } from '../../../components/ui/DataViz';

interface PhaseMilestonesProps {
  currentDay: number;
}

export function PhaseMilestones({ currentDay }: PhaseMilestonesProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(() => {
    if (currentDay <= 7) return 1;
    if (currentDay <= 14) return 2;
    return 3;
  });

  const getPhaseStatus = (phase: PhaseInfo) => {
    if (currentDay > phase.endDay) return 'completed';
    if (currentDay >= phase.startDay && currentDay <= phase.endDay) return 'active';
    return 'locked';
  };

  const toggleExpand = (phaseNum: number) => {
    setExpandedPhase((prev) => (prev === phaseNum ? null : phaseNum));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[12px] font-bold uppercase tracking-wider text-ink">
          21-Day 3-Phase Milestone Roadmap
        </p>
        <span className="text-[11px] font-bold text-accent">
          {currentDay > 21 ? 'Mastery Completed!' : `Phase ${currentDay <= 7 ? 1 : currentDay <= 14 ? 2 : 3} of 3`}
        </span>
      </div>

      <div className="space-y-2.5">
        {CHALLENGE_PHASES.map((phase) => {
          const status = getPhaseStatus(phase);
          const isExpanded = expandedPhase === phase.phase;
          const isCompleted = status === 'completed';
          const isActive = status === 'active';

          // Calculate progress inside this specific phase
          const span = phase.endDay - phase.startDay + 1;
          const daysInPhase = isCompleted
            ? span
            : isActive
              ? Math.max(0, Math.min(span, currentDay - phase.startDay + 1))
              : 0;
          const phasePct = Math.round((daysInPhase / span) * 100);

          return (
            <div
              key={phase.phase}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isActive
                  ? 'border-emerald-500/40 bg-surface2/90 shadow-lg shadow-emerald-500/10'
                  : isCompleted
                    ? 'border-emerald-500/20 bg-surface2/60'
                    : 'border-hairline bg-surface2/40 opacity-75'
              }`}
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => toggleExpand(phase.phase)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-2xl text-[16px] font-black ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isActive
                          ? 'bg-accent/20 text-accent shadow-sm'
                          : 'bg-surface3 text-ink3'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-5 text-emerald-400" />
                    ) : isActive ? (
                      <Zap className="size-5 text-accent" />
                    ) : (
                      <Lock className="size-4 text-ink3" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[14px] font-bold ${isActive ? 'text-ink' : isCompleted ? 'text-emerald-200' : 'text-ink2'}`}>
                        {phase.name}
                      </p>
                    </div>
                    <p className="text-[11.5px] text-ink3">
                      {phase.dayRange} · {phase.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : isActive
                          ? 'bg-accentsoft text-accent'
                          : 'bg-surface3 text-ink3'
                    }`}
                  >
                    {isCompleted ? 'Done ✓' : isActive ? `${phasePct}%` : 'Locked'}
                  </span>
                  <ChevronDown
                    className={`size-4 text-ink3 transition-transform ${
                      isExpanded ? 'rotate-180 text-ink' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Progress bar inside active phase */}
              {isActive && (
                <div className="px-4 pb-2">
                  <ProgressBar value={phasePct} tone="accent" height={6} />
                </div>
              )}

              {/* Expandable details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-hairline px-4 py-3.5 space-y-3 bg-surface3/30"
                  >
                    <p className="text-[12.5px] text-ink2 leading-relaxed">
                      {phase.description}
                    </p>

                    <div className="flex items-start gap-2.5 rounded-2xl bg-surface3/60 p-3">
                      <Brain className="size-4 shrink-0 text-sky-400 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                          Neuroscience Insight
                        </p>
                        <p className="text-[11.5px] text-ink3 mt-0.5 leading-relaxed">
                          {phase.scientificInsight}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-3">
                      <Shield className="size-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          Key Daily Action
                        </p>
                        <p className="text-[11.5px] text-ink2 mt-0.5 leading-relaxed">
                          {phase.keyAction}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
