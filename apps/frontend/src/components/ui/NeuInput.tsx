'use client';

import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  label?: string;
}

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  ({ icon, rightIcon, error, label, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--neu-text-muted)' }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'neu-input',
              icon && 'pl-11',
              rightIcon && 'pr-11',
              error && '!border-red-400',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--neu-text-muted)' }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1.5 text-xs text-red-500 font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
NeuInput.displayName = 'NeuInput';
