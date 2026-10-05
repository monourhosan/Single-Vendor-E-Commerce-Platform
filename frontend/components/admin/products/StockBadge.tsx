'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface StockBadgeProps {
  quantity: number;
  threshold?: number;
  showIcon?: boolean;
}

export function StockBadge({ quantity, threshold = 5, showIcon = true }: StockBadgeProps) {
  if (quantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        {showIcon && <XCircle className="w-3.5 h-3.5 shrink-0" />}
        <span>Out of Stock (0)</span>
      </span>
    );
  }

  if (quantity <= threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
        <span>Low Stock ({quantity})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      {showIcon && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
      <span>In Stock ({quantity})</span>
    </span>
  );
}
