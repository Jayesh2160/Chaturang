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
      <div className="w-full space-y-2 text-left">
        {label ? (
          <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {label}
          </label>
        ) : null}
        <input
          id={id}
          type={type}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-4 py-3 bg-zinc-950/80 border border-white/5 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-accent/40 focus:ring-4 focus:ring-brand-accent/10 transition-all duration-300',
              error ? 'border-red-500/40 focus:ring-red-500/10' : '',
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
