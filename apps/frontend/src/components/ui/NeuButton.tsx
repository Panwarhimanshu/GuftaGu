'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type Variant = 'default' | 'primary' | 'accent' | 'danger' | 'ghost' | 'icon';
type Size    = 'sm' | 'md' | 'lg' | 'xl';

interface NeuButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2.5',
  xl: 'px-9 py-4 text-lg gap-3',
};

const variantStyles: Record<Variant, string> = {
  default: 'neu-btn',
  primary: 'neu-btn-primary',
  accent:  'neu-btn-accent',
  danger:  'neu-btn-danger',
  ghost:   'rounded-neu px-5 py-2.5 text-sm gap-2 inline-flex items-center justify-center transition-all hover:opacity-80 active:scale-95',
  icon:    'neu-btn-icon',
};

export const NeuButton = forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ variant = 'default', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        disabled={disabled || loading}
        className={clsx(
          variantStyles[variant],
          variant !== 'icon' && sizeClasses[size],
          'font-semibold select-none',
          (disabled || loading) && 'opacity-60 cursor-not-allowed',
          className,
        )}
        style={{ color: variant === 'default' ? 'var(--neu-text)' : undefined, ...props.style }}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    );
  },
);
NeuButton.displayName = 'NeuButton';
