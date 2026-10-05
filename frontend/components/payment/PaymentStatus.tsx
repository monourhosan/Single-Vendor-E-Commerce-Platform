'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface PaymentStatusProps {
  status: 'initiated' | 'completed' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'pending';
  transactionId?: string | null;
  amount?: number | string;
  gateway?: string;
  compact?: boolean;
}

export function PaymentStatus({
  status,
  transactionId,
  amount,
  gateway = 'bkash',
  compact = false,
}: PaymentStatusProps) {
  const normalizedStatus = status.toLowerCase();

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case 'paid':
      case 'completed':
        return {
          label: 'Payment Verified & Completed',
          badgeText: 'Completed',
          icon: CheckCircle2,
          colorClass: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40',
          badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        };
      case 'initiated':
      case 'pending':
        return {
          label: 'Payment Session Initiated',
          badgeText: 'Pending Authorization',
          icon: Clock,
          colorClass: 'text-amber-400 bg-amber-950/80 border-amber-500/40',
          badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
        };
      case 'refunded':
        return {
          label: 'Payment Refunded',
          badgeText: 'Refunded',
          icon: RefreshCw,
          colorClass: 'text-purple-400 bg-purple-950/80 border-purple-500/40',
          badgeClass: 'bg-purple-950 text-purple-300 border-purple-800',
        };
      case 'cancelled':
        return {
          label: 'Cancelled by Customer',
          badgeText: 'Cancelled',
          icon: AlertCircle,
          colorClass: 'text-slate-400 bg-slate-900 border-slate-700',
          badgeClass: 'bg-slate-900 text-slate-400 border-slate-700',
        };
      case 'failed':
      default:
        return {
          label: 'Transaction Declined / Failed',
          badgeText: 'Failed',
          icon: XCircle,
          colorClass: 'text-rose-400 bg-rose-950/80 border-rose-500/40',
          badgeClass: 'bg-rose-950 text-rose-300 border-rose-800',
        };
    }
  };

  const { label, badgeText, icon: Icon, colorClass, badgeClass } = getStatusConfig();

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="capitalize">{badgeText}</span>
      </span>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border ${colorClass} space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0" />
          <span className="font-bold text-sm">{label}</span>
        </div>
        <span className="text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-black/30">
          {gateway}
        </span>
      </div>

      <div className="text-xs space-y-1 text-slate-300 pt-1">
        {transactionId && (
          <div className="flex justify-between">
            <span className="text-slate-400">Transaction ID:</span>
            <span className="font-mono text-white font-medium">{transactionId}</span>
          </div>
        )}
        {amount && (
          <div className="flex justify-between">
            <span className="text-slate-400">Captured Amount:</span>
            <span className="font-bold text-white">{formatCurrency(amount)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
