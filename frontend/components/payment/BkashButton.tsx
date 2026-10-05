'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface BkashButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  amount?: number | string;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BkashButton({
  amount,
  isLoading = false,
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: BkashButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }[size];

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center font-bold text-white rounded-xl transition-all duration-200 shadow-lg bg-[#e2136e] hover:bg-[#c70d5e] active:scale-[0.98] shadow-pink-900/30 hover:shadow-pink-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Connecting to bKash...</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2.5">
          {/* bKash Stylized Logo Mark */}
          <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#e2136e] text-[11px] font-black shrink-0 shadow-sm">
            ৳
          </span>
          <span>{children || (amount ? `Pay ${formatCurrency(amount)} with bKash` : 'Pay with bKash')}</span>
        </span>
      )}
    </button>
  );
}
