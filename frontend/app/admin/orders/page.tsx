'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/order';
import { deliveryService } from '@/services/delivery';
import { paymentService } from '@/services/payment.service';
import { AdminHeader } from '@/components/AdminHeader';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import {
  ShoppingBag,
  Search,
  Eye,
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  CreditCard
} from 'lucide-react';

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBookingDelivery, setIsBookingDelivery] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', search, orderStatusFilter, paymentStatusFilter],
    queryFn: () =>
      orderService.getAdminOrders({
        search: search || undefined,
        order_status: orderStatusFilter || undefined,
        payment_status: paymentStatusFilter || undefined,
      }),
  });

  const orders: Order[] = ordersData?.data || [];

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, { order_status: newStatus });
      showToast('success', 'Order Updated', `Status changed to ${newStatus}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus as any });
      }
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleBookCarryBee = async (orderId: number) => {
    setIsBookingDelivery(true);
    try {
      const res = await deliveryService.bookDelivery(orderId);
      showToast('success', 'CarryBee Booked', `Consignment ID: ${res.data.consignment_id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setIsDetailModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Booking Failed', err.message);
    } finally {
      setIsBookingDelivery(false);
    }
  };

  const handleRefundPayment = async (order: Order) => {
    if (!window.confirm(`Are you sure you want to issue a bKash refund for Order #${order.order_number}?`)) {
      return;
    }

    setIsRefunding(true);
    try {
      const paymentID = order.payment?.transaction_id || `PAY_${order.order_number}`;
      const trxID = order.payment?.transaction_id || `TRX_${order.order_number}`;

      const res = await paymentService.refundBkashPayment({
        paymentID,
        trxID,
        amount: order.total,
        orderID: order.id,
        reason: 'Refunded by administrator from Orders portal',
      });

      if (res.transactionStatus === 'Completed' || res.statusCode === '0000') {
        showToast('success', 'Refund Processed', `bKash refund completed. Refund TrxID: ${res.refundTrxID || 'N/A'}`);
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({ ...selectedOrder, payment_status: 'refunded', order_status: 'cancelled' });
        }
      } else {
        showToast('error', 'Refund Failed', res.statusMessage || 'Unable to process refund.');
      }
    } catch (err: any) {
      showToast('error', 'Refund Error', err.response?.data?.message || err.message || 'Refund request failed.');
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        title="Customer Order Management"
        description="Review customer orders, update delivery progress, and dispatch CarryBee parcels"
      />

      <div className="px-6 space-y-6">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by order #, phone, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed / Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Order Number</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Payment</th>
                  <th className="py-3.5 px-6">Order Status</th>
                  <th className="py-3.5 px-6">CarryBee Tracking</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Loading order records...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-white">
                        {ord.order_number}
                      </td>

                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-white">{ord.customer_name}</p>
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
                        <select
                          value={ord.order_status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-6 font-mono text-[11px] text-amber-400">
                        {ord.delivery?.tracking_number || (
                          <span className="text-slate-500">Not Dispatched</span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                        {formatDate(ord.created_at)}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-1.5"
                          onClick={() => handleViewOrder(ord)}
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Order #${selectedOrder.order_number}`}
          description={`Placed on ${formatDate(selectedOrder.created_at)}`}
          className="max-w-2xl"
        >
          <div className="space-y-6 text-xs text-slate-300">
            {/* Customer & Address */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block font-semibold">Customer Details</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedOrder.customer_name}</p>
                <p>{selectedOrder.customer_phone}</p>
                <p className="text-slate-400">{selectedOrder.customer_email}</p>
              </div>

              <div>
                <span className="text-slate-500 block font-semibold">Delivery Destination</span>
                <p className="mt-0.5 text-slate-200 leading-relaxed">
                  {selectedOrder.delivery_address}
                </p>
              </div>
            </div>

            {/* Payment Details & bKash Refund Action */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-pink-400" />
                  <span className="font-bold text-white text-xs">Payment Information</span>
                  <Badge variant={selectedOrder.payment_status === 'paid' ? 'success' : selectedOrder.payment_status === 'refunded' ? 'danger' : 'warning'}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p>
                    Gateway: <strong className="text-white uppercase font-mono">{selectedOrder.payment?.gateway || 'bKash'}</strong>
                  </p>
                  {selectedOrder.payment?.transaction_id && (
                    <p>
                      Transaction ID: <span className="text-slate-200 font-mono">{selectedOrder.payment.transaction_id}</span>
                    </p>
                  )}
                </div>
              </div>

              {selectedOrder.payment_status === 'paid' && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isRefunding}
                  onClick={() => handleRefundPayment(selectedOrder)}
                  className="text-rose-400 hover:text-rose-300 border-rose-900/60 hover:bg-rose-950/40 gap-1.5 font-bold shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refund Payment</span>
                </Button>
              )}
            </div>

            {/* CarryBee Consignment Dispatch Card */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-400 block text-xs">CarryBee Courier Status</span>
                {selectedOrder.delivery ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="font-mono text-white">Consignment: {selectedOrder.delivery.consignment_id}</p>
                    <p className="font-mono text-slate-400">Tracking: {selectedOrder.delivery.tracking_number}</p>
                    <Badge variant="carrybee" className="mt-1 capitalize">
                      {selectedOrder.delivery.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-slate-400 mt-0.5">No CarryBee consignment booked yet.</p>
                )}
              </div>

              {!selectedOrder.delivery && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                  isLoading={isBookingDelivery}
                  onClick={() => handleBookCarryBee(selectedOrder.id)}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Book CarryBee Parcel</span>
                </Button>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Ordered Items ({selectedOrder.items?.length || 0})
              </h4>
              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{item.product_name}</p>
                      <p className="text-slate-400 text-[11px]">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="text-white">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping Fee:</span>
                <span className="text-amber-400">{formatCurrency(selectedOrder.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                <span>Total:</span>
                <span className="text-sky-400">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
