import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Mic, MicOff, RotateCcw } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { MicStatus } from '../useVoiceCommands';

export interface ReaderStageProps {
  chunk: string[];
  index: number;
  total: number;
  percent: number;
  wordsRead: number;
  totalWords: number;
  finished: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
  /* Voice */
  voiceEnabled: boolean;
  micStatus: MicStatus;
  lastHeard: string;
  onToggleVoice: () => void;
  accent?: string;
}

/** The 3-word stage plus navigation — shared by plain and Pomodoro modes. */
export function ReaderStage({
  chunk, index, total, percent, wordsRead, totalWords, finished,
  onNext, onPrevious, onRestart,
  voiceEnabled, micStatus, lastHeard, onToggleVoice,
  accent = '#0ea5e9',
}: ReaderStageProps) {
  const listening = micStatus === 'listening';

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Progress */}
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-ink3">
          <span>{index + 1} / {total || 1}</span>
          <span>{wordsRead} / {totalWords} words</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface3">
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Word stage */}
      <div className="relative flex min-h-[190px] w-full items-center justify-center overflow-hidden rounded-[28px] border border-hairline bg-surface2/60 px-6">
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(60% 60% at 50% 50%, ${accent}22, transparent 70%)` }}
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
            transition={{ duration: 0.22 }}
            className="relative z-10 text-center text-[30px] font-bold leading-snug tracking-tight text-ink"
          >
            {chunk.length > 0 ? chunk.join(' ') : '—'}
          </motion.p>
        </AnimatePresence>

        {finished && (
          <span className="absolute bottom-3 rounded-full bg-emerald-500/15 px-3 py-1 text-[10.5px] font-bold text-emerald-300">
            End of text
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
        <motion.button
          type="button" whileTap={{ scale: 0.94 }} onClick={onPrevious} disabled={index === 0}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-surface2 text-[14px] font-bold text-ink ring-1 ring-white/10 disabled:opacity-35"
        >
          <ChevronLeft className="size-5" /> Prev
        </motion.button>

        <motion.button
          type="button" whileTap={{ scale: 0.9 }} onClick={onRestart}
          aria-label="Restart from beginning"
          className="grid size-12 place-items-center rounded-full bg-surface3 text-ink3 hover:text-ink"
        >
          <RotateCcw className="size-4" />
        </motion.button>

        <motion.button
          type="button" whileTap={{ scale: 0.94 }} onClick={onNext} disabled={finished}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl text-[14px] font-black text-white shadow-lg disabled:opacity-35"
          style={{ background: accent }}
        >
          Next <ChevronRight className="size-5" />
        </motion.button>
      </div>

      {/* Voice control */}
      <div className="w-full rounded-2xl border border-hairline bg-surface2/50 p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleVoice}
            aria-label={voiceEnabled ? 'Disable voice commands' : 'Enable voice commands'}
            className={cn(
              'relative grid size-11 shrink-0 place-items-center rounded-full transition-colors',
              listening ? 'bg-emerald-500/20 text-emerald-300' : 'bg-surface3 text-ink3',
            )}
          >
            {listening && (
              <motion.span
                className="absolute inset-0 rounded-full ring-2 ring-emerald-400/50"
                animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
            {voiceEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink">
              {micStatus === 'listening' ? 'Listening — say “Next”'
                : micStatus === 'requesting' ? 'Requesting microphone…'
                : micStatus === 'denied' ? 'Microphone blocked'
                : micStatus === 'unsupported' ? 'Voice not supported here'
                : micStatus === 'error' ? 'Voice error — tap to retry'
                : 'Voice navigation off'}
            </p>
            <p className="truncate text-[11px] text-ink3">
              {micStatus === 'denied'
                ? 'Allow mic access in your browser settings'
                : lastHeard ? `Heard: “${lastHeard}”` : 'Say “Next”, “Back” or “Restart”'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
