import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  /** Adds an accent gradient wash to the card header area. */
  accent?: string;
}

/** Generic surface card used by every mini-app dashboard. */
export function Card({ title, subtitle, action, children, className, padded = false }: CardProps) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[14.5px] font-semibold tracking-tight text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11.5px] text-ink3">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn(padded && 'px-4 pb-4', !title && padded && 'pt-4')}>{children}</div>
    </section>
  );
}
