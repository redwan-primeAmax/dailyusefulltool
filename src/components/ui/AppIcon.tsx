import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { AppIconComponent } from '../../types';

const SIZES = {
  sm: { box: 'size-11 rounded-[14px]', icon: 'size-[22px]', label: 'text-[10.5px]' },
  md: { box: 'size-14 rounded-[19px]', icon: 'size-[26px]', label: 'text-[11px]' },
  lg: { box: 'size-16 rounded-[20px]', icon: 'size-8', label: 'text-[11px]' },
  xl: { box: 'size-[84px] rounded-[26px]', icon: 'size-10', label: 'text-[13px]' },
} as const;

export type IconSize = keyof typeof SIZES;

/* eslint-disable @typescript-eslint/no-unused-vars */
export interface AppIconProps {
  icon: AppIconComponent;
  gradient: string;
  size?: IconSize;
  label?: string;
  onClick?: () => void;
  badge?: string;
  className?: string;
  /** Reserved for system apps that always live on the device. */
  dim?: boolean;
}

/** Squircle launcher icon with Android-style label + press physics. */
export function AppIcon({
  icon: Icon,
  gradient,
  size = 'md',
  label,
  onClick,
  badge,
  className,
  dim,
}: AppIconProps) {
  const s = SIZES[size];
  const [iconReady, setIconReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => !cancelled && setIconReady(true);
    const id = setTimeout(load, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  const body = (
    <span
      className={cn(
        'relative grid place-items-center bg-gradient-to-br text-white shadow-lg shadow-black/40',
        'ring-1 ring-white/10',
        s.box,
        gradient,
        dim && 'saturate-[0.85]',
      )}
    >
      {iconReady ? (
        <Icon className={s.icon} strokeWidth={2.1} />
      ) : (
        <span className={cn('rounded-full bg-white/25', s.icon)} />
      )}
      {badge && (
        <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
          {badge}
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/25 to-transparent opacity-60" />
    </span>
  );

  if (!onClick) {
    return (
      <div className={cn('flex flex-col items-center gap-1.5', className)}>
        {body}
        {label && <span className={cn('max-w-[74px] truncate font-medium text-white/90 drop-shadow', s.label)}>{label}</span>}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className={cn('flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60', className)}
    >
      {body}
      {label && <span className={cn('max-w-[74px] truncate font-medium text-white/90 drop-shadow', s.label)}>{label}</span>}
    </motion.button>
  );
}
