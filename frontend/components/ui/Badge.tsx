import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'bkash' | 'carrybee';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
    info: 'bg-sky-950/80 text-sky-300 border-sky-800/60',
    outline: 'border border-slate-700 text-slate-400',
    bkash: 'bg-pink-950/80 text-pink-300 border-pink-800/60 font-medium',
    carrybee: 'bg-amber-950/80 text-amber-300 border-amber-800/60 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
