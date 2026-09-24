import { formatClock } from '../../utils/date';
import { cn } from '../../utils/cn';

export interface StatusBarProps {
  now: Date;
  clock24h: boolean;
  onOpenShade: () => void;
  /** When true, renders nothing (immersive apps & store). */
  hidden?: boolean;
  label?: string;
}

/** Minimal status bar — only shows the time and tap-to-open shade on the launcher. */
export function StatusBar({ now, clock24h, onOpenShade, hidden, label }: StatusBarProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onOpenShade}
      aria-label="Open quick settings"
      className={cn(
        'relative z-40 flex h-7 w-full shrink-0 items-center justify-center px-6 pt-1 text-[12px] font-semibold',
        'text-white/85',
      )}
    >
      <span className="flex items-center gap-1.5 tabular-nums">
        {formatClock(now, clock24h)}
        {label && (
          <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">{label}</span>
        )}
      </span>
    </button>
  );
}
