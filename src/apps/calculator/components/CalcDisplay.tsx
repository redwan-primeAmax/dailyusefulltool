import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

export interface CalcDisplayProps {
  expression: string;
  grouped: string;
  preview: string;
  memory: number;
}

/** Right-aligned expression readout with live result preview. */
export function CalcDisplay({ expression, grouped, preview, memory }: CalcDisplayProps) {
  const len = grouped.length;
  const size =
    len > 22 ? 'text-[26px]' :
    len > 16 ? 'text-[34px]' :
    len > 11 ? 'text-[44px]' : 'text-[56px]';

  return (
    <div className="relative flex min-h-[190px] w-full flex-col items-end justify-end gap-2 px-6 pb-5 pt-10">
      {memory !== 0 && (
        <span className="absolute left-6 top-10 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/60">
          M
        </span>
      )}

      <div className="no-scrollbar w-full overflow-x-auto text-right">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={grouped}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.14 }}
            className={cn(
              'whitespace-nowrap font-light leading-none tracking-tight text-white tabular-nums',
              size,
            )}
          >
            {grouped}
          </motion.p>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[17px] font-medium tabular-nums text-teal-300/70"
          >
            = {preview}
          </motion.p>
        )}
      </AnimatePresence>

      {!expression && !preview && (
        <p className="text-[12px] font-medium text-white/25">Type an expression</p>
      )}
    </div>
  );
}
