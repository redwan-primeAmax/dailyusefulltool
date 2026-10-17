import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { AppHeader } from './AppHeader';
import { AmbientBackdrop } from './AmbientBackdrop';

export interface ScreenShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onOpenSettings?: () => void;
  headerActions?: ReactNode;
  /** Extra slot rendered above the scroll area (hero rings, dashboards). */
  hero?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Resets the scroll area to the top when the active in-app page changes. */
  scrollKey?: string;
  footer?: ReactNode;
}

/**
 * Standard in-app screen scaffold: sticky header with the settings trigger,
 * scrollable body, and bottom breathing room for the system nav bar.
 */
export function ScreenShell({
  title,
  subtitle,
  icon,
  onOpenSettings,
  headerActions,
  hero,
  children,
  className,
  contentClassName,
  scrollKey,
  footer,
}: ScreenShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollKey !== undefined && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [scrollKey]);

  return (
    <div className={cn('relative flex h-full min-h-0 flex-col overflow-hidden bg-surface', className)}>
      <AmbientBackdrop />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <AppHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          onOpenSettings={onOpenSettings}
          actions={headerActions}
        />
        <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {hero}
          <div className={cn('space-y-4 px-4 pb-32 pt-4', contentClassName)}>{children}</div>
          {footer}
        </div>
      </div>
    </div>
  );
}
