import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';

export interface BackButtonProps {
  onPress: () => void;
  variant?: 'bar' | 'fab' | 'pill';
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * The single source of truth for backwards navigation across the whole OS.
 * Rendered by the system navigation bar (bar/fab) and by standalone screens
 * (pill) so every view — app, store page or settings — always has one.
 */
export function BackButton({
  onPress,
  variant = 'fab',
  label = 'Back',
  disabled,
  className,
}: BackButtonProps) {
  const shared = cn(
    'tap inline-flex items-center justify-center gap-2 font-semibold text-ink',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    disabled && 'pointer-events-none opacity-40',
  );

  if (variant === 'bar') {
    return (
      <motion.button
        type="button"
        aria-label={label}
        onClick={onPress}
        whileTap={{ scale: 0.92 }}
        className={cn(
          shared,
          'h-11 w-full max-w-[104px] rounded-full border border-hairline bg-white/5 text-ink2',
          'hover:bg-white/10 hover:text-ink',
          className,
        )}
      >
        <ArrowLeft className="size-[18px]" />
        <span className="text-[13px]">{label}</span>
      </motion.button>
    );
  }

  if (variant === 'pill') {
    return (
      <motion.button
        type="button"
        aria-label={label}
        onClick={onPress}
        whileTap={{ scale: 0.94 }}
        className={cn(
          shared,
          'h-11 gap-1.5 rounded-full bg-accentsoft px-4 text-[13px] text-accent',
          className,
        )}
      >
        <ArrowLeft className="size-4" />
        {label}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onPress}
      whileTap={{ scale: 0.9 }}
      className={cn(
        shared,
        'size-11 rounded-full border border-hairline bg-surface2/80 backdrop-blur',
        'text-ink2 hover:bg-white/10 hover:text-ink',
        className,
      )}
    >
      <ArrowLeft className="size-[19px]" />
    </motion.button>
  );
}
