import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface AmbientBackdropProps {
  /** Two accent colours used for the drifting orbs. */
  from?: string;
  to?: string;
  className?: string;
  /** Disables motion (respects the device "reduce motion" preference). */
  still?: boolean;
}

/**
 * Subtle, GPU-cheap background motion shared by app surfaces.
 * Two blurred radial orbs drift on long, offset loops so the screen feels
 * alive without competing with content.
 */
export function AmbientBackdrop({
  from = 'rgba(14,165,233,0.14)',
  to = 'rgba(20,184,166,0.10)',
  className,
  still = false,
}: AmbientBackdropProps) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <motion.span
        className="absolute -left-24 -top-20 size-72 rounded-full blur-3xl"
        style={{ background: from }}
        animate={still ? undefined : { x: [0, 26, 0], y: [0, 18, 0], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute -bottom-28 -right-20 size-80 rounded-full blur-3xl"
        style={{ background: to }}
        animate={still ? undefined : { x: [0, -22, 0], y: [0, -16, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
    </div>
  );
}
