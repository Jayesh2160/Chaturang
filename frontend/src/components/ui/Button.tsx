import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-brand-accent/50 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.96] tracking-wide';
    
    const variants = {
      primary: 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-sm hover:shadow-white/10 uppercase text-xs tracking-wider font-bold',
      secondary: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-white/5',
      outline: 'bg-transparent text-zinc-200 border border-white/10 hover:bg-white/5 hover:border-white/20',
      ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5',
      danger: 'bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-500/20 shadow-sm',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
