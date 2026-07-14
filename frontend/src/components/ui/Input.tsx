import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label ? (
          <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </label>
        ) : null}
        <input
          id={id}
          type={type}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-4 py-2.5 bg-zinc-900/60 border rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all duration-200',
              error ? 'border-red-500/80 focus:ring-red-500/30' : 'border-zinc-800 focus:border-violet-500/50',
              className
            )
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-400 font-medium mt-1">{error}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
