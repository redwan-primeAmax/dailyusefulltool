import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { IconButton } from '../CustomButton';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Opens the app's own settings screen (top-trigger requirement). */
  onOpenSettings?: () => void;
  actions?: ReactNode;
  settingsLabel?: string;
  className?: string;
}

/** Collapsing Material-style top app bar with the standard settings trigger. */
export function AppHeader({
  title,
  subtitle,
  icon,
  onOpenSettings,
  actions,
  settingsLabel = 'Settings',
  className,
}: AppHeaderProps) {
  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={cn(
        'glass sticky top-0 z-30 flex items-center gap-3 border-b border-hairline px-4 pb-3 pt-3.5',
        className,
      )}
    >
      {icon && (
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accentsoft text-accent">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="truncate text-[11.5px] font-medium text-ink3">{subtitle}</p>}
      </div>
      {actions}
      {onOpenSettings && (
        <IconButton label={settingsLabel} onClick={onOpenSettings} tone="tonal">
          <Settings className="size-[19px]" />
        </IconButton>
      )}
    </motion.header>
  );
}
