'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { orderService } from '@/services/order';
import { deliveryService } from '@/services/delivery';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Truck,
  Search,
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('number') || '';
  const [query, setQuery] = useState(initialQuery);
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [trackingTimeline, setTrackingTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performTracking = async (numberToSearch: string) => {
    if (!numberToSearch.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (numberToSearch.startsWith('ORD-')) {
        const orderData = await orderService.trackOrder(numberToSearch.trim());
        setSearchedOrder(orderData.order);
        setTrackingTimeline(orderData.tracking?.timeline || [
          { status: 'Order Placed & Confirmed', time: formatDate(orderData.order?.created_at) },
          { status: 'CarryBee Consignment Created', time: 'In Progress' },
        ]);
      } else {
        // Direct tracking number lookup
        const deliveryData = await deliveryService.trackConsignment(numberToSearch.trim());
        setTrackingTimeline(deliveryData.tracking?.timeline || []);
        setSearchedOrder(deliveryData.delivery?.order || null);
      }
    } catch (err: any) {
      setErrorMsg('Could not find delivery records for this identifier. Please verify the order number.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performTracking(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performTracking(query);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title & Lookup Form */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 text-xs font-semibold">
          <Truck className="w-3.5 h-3.5" />
          <span>CarryBee Courier Live Logistics Tracker</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Track Your Delivery
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Enter your Order Number (e.g. ORD-20261003-XXXX) or CarryBee Tracking Number.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. ORD-20261003-XXXX"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            Track
          </Button>
        </form>

        {errorMsg && (
          <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Tracking Results Card */}
      {searchedOrder && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl divide-y divide-slate-800 animate-in fade-in">
          {/* Header */}
          <div className="p-6 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Order Reference</span>
              <h3 className="text-xl font-bold text-white font-mono">{searchedOrder.order_number}</h3>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={searchedOrder.order_status === 'delivered' ? 'success' : 'carrybee'}>
                Status: {searchedOrder.order_status?.toUpperCase()}
              </Badge>
              <Badge variant={searchedOrder.payment_status === 'paid' ? 'success' : 'warning'}>
                Payment: {searchedOrder.payment_status?.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Courier Details */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block">Courier Partner</span>
              <strong className="text-amber-400 font-bold text-sm">CarryBee Express Logistics</strong>
            </div>

            <div>
              <span className="text-slate-500 block">Consignment ID</span>
              <span className="font-mono text-slate-200">
                {searchedOrder.delivery?.consignment_id || 'Generating...'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Tracking Number</span>
              <span className="font-mono text-slate-200">
                {searchedOrder.delivery?.tracking_number || 'Pending Pickup'}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Consignment Event History
            </h4>

            <div className="space-y-4 border-l-2 border-slate-800 ml-3 pl-4">
              {trackingTimeline.map((item: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-slate-900" />
                  <p className="text-xs font-semibold text-white">{item.status}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="p-6 bg-slate-950/40 text-xs text-slate-400 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Destination:</strong>
              <p>{searchedOrder.delivery_address}</p>
              <p className="mt-1 text-slate-500">Recipient: {searchedOrder.customer_name} ({searchedOrder.customer_phone})</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-12 text-center text-white">Loading CarryBee Tracking...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
