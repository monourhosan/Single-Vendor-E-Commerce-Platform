'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, RotateCcw, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'N/A';
  const reason = searchParams.get('reason') || 'Transaction declined or cancelled';
  const gateway = searchParams.get('gateway') || 'Payment Gateway';

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-950/40">
        <AlertCircle className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Payment Was Not Completed
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          We were unable to process your payment through {gateway}. Any temporarily reserved stock has been released back into inventory.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto space-y-2 text-left">
        <div className="flex justify-between">
          <span>Order Reference:</span>
          <strong className="font-mono text-white">{orderNumber}</strong>
        </div>
        <div className="flex justify-between">
          <span>Failure Reason:</span>
          <span className="text-rose-400 font-medium capitalize">{reason.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link href="/checkout">
          <Button variant="primary" size="md" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Try Payment Again</span>
          </Button>
        </Link>

        <Link href="/">
          <Button variant="outline" size="md" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto p-12 text-center text-white">Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
