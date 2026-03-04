import { cn } from '../../utils/cn';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' && 'px-2 py-1 text-xs',
        size === 'md' && 'px-3 py-1.5 text-sm',
        variant === 'primary' && 'bg-purple-600 text-white hover:bg-purple-700',
        variant === 'secondary' && 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700',
        variant === 'ghost' && 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
        variant === 'danger' && 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
