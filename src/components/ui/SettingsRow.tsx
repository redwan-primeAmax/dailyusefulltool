import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SettingsRowProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  /** Right-hand control (Toggle, Stepper, Segmented, chevron…). */
  control?: ReactNode;
  /** Optional full-width control rendered below the label row. */
  inline?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  className?: string;
}

/** Atomic settings list row — composes with any control slot. */
export function SettingsRow({
  icon,
  label,
  description,
  control,
  inline,
  onClick,
  danger,
  className,
}: SettingsRowProps) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
        onClick && 'tap cursor-pointer hover:bg-white/[0.04]',
        danger && 'text-red-400',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-xl border border-hairline bg-surface3/80',
            danger ? 'text-red-400' : 'text-ink2',
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[14px] font-semibold', danger ? '' : 'text-ink')}>
          {label}
        </span>
        {description && <span className="mt-0.5 block text-[12px] leading-snug text-ink3">{description}</span>}
        {inline && <span className="mt-3 block">{inline}</span>}
      </span>
      {control && <span className="shrink-0">{control}</span>}
    </Wrapper>
  );
}

export function SettingsGroup({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-2', className)}>
      {title && (
        <header className="px-1">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-accent">{title}</h3>
          {description && <p className="mt-1 text-[12px] text-ink3">{description}</p>}
        </header>
      )}
      <div className="card divide-y divide-hairline overflow-hidden">{children}</div>
    </section>
  );
}
