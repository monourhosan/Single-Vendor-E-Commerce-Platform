'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, RotateCcw, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'N/A';
  const reason = searchParams.get('reason') || 'Transaction declined or cancelled';
  const gateway = searchParams.get('gateway') || 'bKash';

  const formatReason = (rawReason: string) => {
    switch (rawReason.toLowerCase()) {
      case 'customer_cancelled':
        return 'Payment was cancelled by the customer at the PIN authorization stage.';
      case 'execution_failed':
        return 'bKash execution session timed out or returned an invalid response.';
      case 'insufficient_balance':
        return 'Insufficient balance in the customer mobile wallet.';
      case 'payment_declined':
        return 'Transaction was declined by the payment gateway.';
      default:
        return rawReason.replace(/_/g, ' ');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      {/* Alert Icon */}
      <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-950/40 animate-in zoom-in duration-300">
        <AlertCircle className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Payment Was Not Completed
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          We could not complete your transaction through <strong className="text-rose-400 capitalize">{gateway}</strong>.
          Any temporarily reserved stock has been safely restored to inventory.
        </p>
      </div>

      {/* Details Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto space-y-3 text-left shadow-lg">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-slate-400">Order Reference:</span>
          <strong className="font-mono text-white text-sm">{orderNumber}</strong>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 block font-semibold">Gateway Response:</span>
          <p className="text-rose-400 font-medium leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
            {formatReason(reason)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>No amount has been deducted from your account.</span>
        </div>
      </div>

      {/* Recovery Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link href="/checkout">
          <Button variant="primary" size="md" className="gap-2 font-bold shadow-lg">
            <RotateCcw className="w-4 h-4" />
            <span>Try Payment Again</span>
          </Button>
        </Link>

        <Link href="/">
          <Button variant="outline" size="md" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-12 text-center text-white">Loading status...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
