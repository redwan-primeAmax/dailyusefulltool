import { motion } from 'framer-motion';
import { BookOpenCheck } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useReaderSession } from '../../context/ReaderSessionContext';
import { formatDuration } from '../../utils/format';
import { cn } from '../../utils/cn';

/**
 * Live indicator shown in the system navigation bar while a Reader session
 * runs in the background. Tapping it jumps straight back into the session.
 */
export function ReaderStatusPill() {
  const { route, launchApp } = useOS();
  const session = useReaderSession();

  if (!session.active) return null;
  // Hide while the Reader itself is the foreground app.
  if (route?.appId === 'reader') return null;

  const isPomo = session.mode === 'pomodoro';
  const accent = isPomo
    ? session.pomoPhase === 'focus' ? 'text-red-400' : 'text-emerald-400'
    : 'text-sky-400';

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      onClick={() => launchApp('reader')}
      aria-label="Return to reading session"
      className="tap flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 backdrop-blur"
    >
      <span className="relative grid size-4 place-items-center">
        <motion.span
          className={cn('absolute inset-0 rounded-full bg-current opacity-30', accent)}
          animate={{ scale: [1, 1.6], opacity: [0.35, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
        <BookOpenCheck className={cn('size-3.5', accent)} />
      </span>
      <span className="text-[11px] font-bold tabular-nums text-white/85">
        {isPomo ? formatDuration(session.pomoRemaining) : `${session.progress.percent}%`}
      </span>
    </motion.button>
  );
}
