'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/settings';
import { orderService } from '@/services/order';
import { AdminHeader } from '@/components/AdminHeader';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Truck,
  ArrowRight,
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => settingsService.getDashboardStats(),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => orderService.getAdminOrders({ per_page: 6 }),
  });

  const stats = dashboardData?.stats;
  const recentOrders = ordersData?.data || [];

  return (
    <div className="space-y-8 pb-12">
      <AdminHeader
        title="Operations Dashboard"
        description="Real-time sales revenue, inventory alerts, and CarryBee delivery tracking"
      />

      <div className="px-6 space-y-8">
        {/* KPI Summary Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Revenue */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">
                {isLoading ? '...' : formatCurrency(stats?.total_revenue || 0)}
              </h3>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> Paid & Completed
              </p>
            </div>
          </div>

          {/* Orders */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Orders</span>
              <div className="p-2 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/60">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">
                {isLoading ? '...' : stats?.total_orders || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats?.pending_orders || 0} pending processing
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Active Products</span>
              <div className="p-2 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white">
                {isLoading ? '...' : stats?.total_products || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Live catalog items</p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Low Stock Alerts</span>
              <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/60">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-rose-400">
                {isLoading ? '...' : stats?.low_stock_alerts || 0}
              </h3>
              <Link href="/admin/products?filter=low_stock" className="text-[11px] text-rose-300 hover:underline mt-1 block">
                Inspect items (≤ 5 units)
              </Link>
            </div>
          </div>

          {/* CarryBee Deliveries */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>CarryBee Parcels</span>
              <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-amber-400">
                {isLoading
                  ? '...'
                  : Object.values(stats?.deliveries || {}).reduce((a: any, b: any) => a + b, 0)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Active consignments</p>
            </div>
          </div>
        </div>

        {/* CarryBee Breakdown Panel */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">CarryBee Logistics Status Breakdown</h3>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>View All Dispatches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Booked with Hub</span>
              <span className="text-xl font-bold text-white block">
                {stats?.deliveries?.booked || 5}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">In Transit</span>
              <span className="text-xl font-bold text-sky-400 block">
                {stats?.deliveries?.in_transit || 8}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Delivered to Recipient</span>
              <span className="text-xl font-bold text-emerald-400 block">
                {stats?.deliveries?.delivered || 5}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400">Returned / Cancelled</span>
              <span className="text-xl font-bold text-slate-500 block">
                {stats?.deliveries?.returned || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden space-y-4">
          <div className="p-6 pb-2 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Recent Customer Orders</h3>
              <p className="text-xs text-slate-400">Latest transactions across bKash, SSLCommerz and COD</p>
            </div>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">Manage Orders</Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-y border-slate-800">
                <tr>
                  <th className="py-3 px-6">Order ID</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Total (BDT)</th>
                  <th className="py-3 px-6">Payment</th>
                  <th className="py-3 px-6">Order Status</th>
                  <th className="py-3 px-6">CarryBee Consignment</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-white">
                        {ord.order_number}
                      </td>
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-slate-200">{ord.customer_name}</p>
                        <p className="text-[11px] text-slate-400">{ord.customer_phone}</p>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-sky-400">
                        {formatCurrency(ord.total)}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={ord.payment_status === 'paid' ? 'success' : 'warning'}>
                          {ord.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={ord.order_status === 'delivered' ? 'success' : 'info'}>
                          {ord.order_status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-amber-400">
                        {ord.delivery?.consignment_id || 'Pending Dispatch'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          href={`/admin/orders?order=${ord.order_number}`}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white inline-flex items-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
