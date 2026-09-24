import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

/* ---------------------------- Segmented ---------------------------- */

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'flex w-full gap-1 rounded-2xl border border-hairline bg-surface3/70 p-1',
        size === 'sm' ? 'text-[12px]' : 'text-[13px]',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'tap relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 font-semibold',
              active ? 'text-white' : 'text-ink2 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${ariaLabel ?? 'root'}`}
                className="absolute inset-0 rounded-xl bg-accent shadow-md shadow-accent/25"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 truncate">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ Toggle ----------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-300',
        checked ? 'border-accent/40 bg-accent' : 'border-hairline bg-surface3',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 520, damping: 32 }}
        className={cn(
          'absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full shadow',
          checked ? 'right-1 size-5 bg-white' : 'left-1 size-5 bg-ink2',
        )}
      />
    </button>
  );
}

/* ----------------------------- Stepper ----------------------------- */

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  suffix,
  format,
}: {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  format?: (value: number) => string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface3/70 p-1">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clamp(value - step))}
        className="tap grid size-8 place-items-center rounded-full text-ink2 hover:bg-white/5 hover:text-ink"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-[62px] text-center text-[13px] font-semibold tabular-nums text-ink">
        {format ? format(value) : value}
        {suffix && <span className="ml-0.5 text-ink3">{suffix}</span>}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clamp(value + step))}
        className="tap grid size-8 place-items-center rounded-full text-ink2 hover:bg-white/5 hover:text-ink"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/* ----------------------------- Slider ------------------------------ */

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  ariaLabel: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-full">
      <div className="relative flex h-9 items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-surface3">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
        <input
          type="range"
          aria-label={ariaLabel}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-9 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:bg-accent"
        />
      </div>
      <p className="text-right text-[12px] font-semibold tabular-nums text-ink2">
        {format ? format(value) : value}
      </p>
    </div>
  );
}

/* ----------------------------- Fields ------------------------------ */

export function TextField({
  value,
  onChange,
  label,
  placeholder,
  type = 'text',
  suffix,
  className,
}: {
  value: string | number;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'decimal';
  suffix?: string;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink3">
          {label}
        </span>
      )}
      <span className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 focus-within:border-accent/60">
        <input
          type={type === 'decimal' ? 'text' : type}
          inputMode={type === 'text' ? undefined : 'decimal'}
          name={label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'app-input'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-ink3"
        />
        {suffix && <span className="text-[13px] font-semibold text-ink3">{suffix}</span>}
      </span>
    </label>
  );
}

/* ------------------------------ Chip ------------------------------- */

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'tap inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold',
        active
          ? 'border-accent/50 bg-accent text-white shadow-md shadow-accent/25'
          : 'border-hairline bg-surface3/70 text-ink2 hover:text-ink',
        className,
      )}
    >
      {children}
    </Comp>
  );
}
