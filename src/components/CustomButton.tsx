import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'tonal' | 'ghost' | 'outline' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white shadow-lg shadow-accent/25',
  tonal: 'bg-accentsoft text-accent',
  ghost: 'bg-transparent text-ink2 hover:text-ink',
  outline: 'border border-hairline bg-surface2/60 text-ink',
  danger: 'bg-red-500/90 text-white shadow-lg shadow-red-500/20',
  success: 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/20',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-xl gap-1.5',
  md: 'h-11 px-4 text-sm rounded-2xl gap-2',
  lg: 'h-13 px-5 text-[15px] rounded-2xl gap-2.5',
};

type Props = BaseProps & Omit<HTMLMotionProps<'button'>, 'children' | 'className'>;

/** Material-3 flavoured button with press physics, loading + icon slots. */
export function CustomButton({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  leadingIcon,
  trailingIcon,
  children,
  className,
  disabled,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type="button"
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      disabled={isDisabled}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold tracking-tight',
        'transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        isDisabled && 'pointer-events-none opacity-45',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : leadingIcon}
      {children}
      {trailingIcon}
    </motion.button>
  );
}

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'glass' | 'tonal';
};

/** Compact circular icon hit-target used in headers and list rows. */
export function IconButton({ label, children, tone = 'default', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'tap inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink2',
        'hover:bg-white/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent',
        tone === 'glass' && 'glass border border-hairline text-ink',
        tone === 'tonal' && 'bg-accentsoft text-accent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
