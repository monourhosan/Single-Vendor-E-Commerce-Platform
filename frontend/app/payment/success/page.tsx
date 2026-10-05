'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/order';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  Truck,
  Package,
  Calendar,
  CreditCard,
  Printer,
  ShoppingBag,
  ExternalLink,
  Clock
} from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || 'ORD-DEMO-001';
  const trxId = searchParams.get('trx') || 'TRX-SAMPLE-998811';
  const gateway = searchParams.get('gateway') || 'bkash';

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => orderService.getOrder(orderNumber),
    enabled: !!orderNumber,
    retry: 1,
  });

  const consignmentId = order?.delivery?.consignment_id || `CB-CON-${orderNumber.replace('ORD-', '')}`;
  const trackingNumber = order?.delivery?.tracking_number || `CB-TRK-${orderNumber.replace('ORD-', '')}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Hero Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40 animate-in zoom-in">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Payment Successful & Order Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Thank you for shopping with ShopLagbe. Your transaction has been approved and your order is now queued for CarryBee courier dispatch.
        </p>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl divide-y divide-slate-800">
        {/* Invoice Summary Row */}
        <div className="p-6 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Order Number</span>
            <span className="font-mono font-bold text-white text-sm">{orderNumber}</span>
          </div>

          <div>
            <span className="text-slate-400 block">Payment Method</span>
            <span className="font-semibold text-white capitalize">{gateway}</span>
          </div>

          <div>
            <span className="text-slate-400 block">Transaction Reference</span>
            <span className="font-mono text-slate-300 truncate block">{trxId}</span>
          </div>

          <div>
            <span className="text-slate-400 block">Payment Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Paid & Secured
            </span>
          </div>
        </div>

        {/* CarryBee Courier Tracking Card */}
        <div className="p-6 space-y-4 bg-slate-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">CarryBee Courier Consignment</h3>
                <p className="text-xs text-slate-400">Automated Dispatch & Real-Time Tracking</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 block">Consignment ID:</span>
              <span className="font-mono font-bold text-amber-400 text-xs">{consignmentId}</span>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="py-4">
            <div className="grid grid-cols-4 gap-2 text-center text-xs relative">
              <div className="space-y-1.5 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
                  ✓
                </div>
                <span className="font-semibold text-white">Order Paid</span>
                <span className="text-[10px] text-slate-400">Stock Reserved</span>
              </div>

              <div className="space-y-1.5 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/30">
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-semibold text-white">Consignment Booked</span>
                <span className="text-[10px] text-slate-400">CarryBee Hub</span>
              </div>

              <div className="space-y-1.5 flex flex-col items-center opacity-60">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-semibold text-slate-300">In Transit</span>
                <span className="text-[10px] text-slate-500">To District</span>
              </div>

              <div className="space-y-1.5 flex flex-col items-center opacity-60">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-slate-300">Delivered</span>
                <span className="text-[10px] text-slate-500">Destination</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <span className="text-slate-400">
              Tracking Number: <strong className="font-mono text-white">{trackingNumber}</strong>
            </span>
            <Link
              href={`/track?number=${orderNumber}`}
              className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1"
            >
              <span>View Full CarryBee Timeline</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Customer & Delivery Summary */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="space-y-1.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Recipient Information</h4>
            <p className="font-semibold text-slate-200">{order?.customer_name || 'Customer'}</p>
            <p className="text-slate-400">{order?.customer_phone}</p>
            <p className="text-slate-400">{order?.customer_email}</p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Delivery Address</h4>
            <p className="text-slate-300 leading-relaxed">{order?.delivery_address || 'Customer Specified Address'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          variant="outline"
          size="md"
          className="gap-2"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </Button>

        <Link href="/">
          <Button variant="primary" size="md" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-white">Loading Order Confirmation...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
