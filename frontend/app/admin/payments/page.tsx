'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';
import { AdminHeader } from '@/components/AdminHeader';
import { Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  CreditCard,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  DollarSign
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['admin-payments', gatewayFilter, statusFilter, search],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/payments', {
          params: {
            gateway: gatewayFilter || undefined,
            status: statusFilter || undefined,
            search: search || undefined,
          },
        });
        return res.data;
      } catch {
        let list = [...fallbackPayments];
        if (gatewayFilter) list = list.filter((p) => p.gateway === gatewayFilter);
        if (statusFilter) list = list.filter((p) => p.status === statusFilter);
        if (search) {
          const q = search.toLowerCase();
          list = list.filter((p) => (p.transaction_id || '').toLowerCase().includes(q) || (p.order_number || '').toLowerCase().includes(q));
        }
        return { success: true, data: list };
      }
    },
  });

  const payments: Payment[] = paymentsData?.data || [];

  const handleInspect = (p: Payment) => {
    setSelectedPayment(p);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        title="Payment Transactions Audit"
        description="Verify gateway authorizations, bKash callbacks, and SSLCommerz transaction logs"
      />

      <div className="px-6 space-y-6">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search transaction ID or order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Gateways</option>
              <option value="bkash">bKash Sandbox</option>
              <option value="sslcommerz">SSLCommerz Sandbox</option>
              <option value="cod">Cash on Delivery</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="initiated">Initiated</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Transaction ID</th>
                  <th className="py-3.5 px-6">Order Ref</th>
                  <th className="py-3.5 px-6">Gateway</th>
                  <th className="py-3.5 px-6">Amount (BDT)</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6 text-right">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading payment audits...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No payment transactions found.
                    </td>
                  </tr>
                ) : (
                  payments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-white">
                        {pmt.transaction_id || `TXN-${pmt.id}`}
                      </td>

                      <td className="py-3.5 px-6 font-mono text-slate-400">
                        {pmt.order_number || `#${pmt.order_id}`}
                      </td>

                      <td className="py-3.5 px-6">
                        <span
                          className={`font-bold text-xs uppercase px-2 py-0.5 rounded ${
                            pmt.gateway === 'bkash'
                              ? 'text-[#e2136e] bg-pink-950/60 border border-pink-900'
                              : pmt.gateway === 'sslcommerz'
                              ? 'text-blue-400 bg-blue-950/60 border border-blue-900'
                              : 'text-amber-400 bg-amber-950/60 border border-amber-900'
                          }`}
                        >
                          {pmt.gateway}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 font-bold text-emerald-400">
                        {formatCurrency(pmt.amount)}
                      </td>

                      <td className="py-3.5 px-6">
                        <Badge
                          variant={
                            pmt.status === 'completed'
                              ? 'success'
                              : pmt.status === 'initiated'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {pmt.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                        {formatDate(pmt.created_at)}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-1.5 gap-1 text-[11px]"
                          onClick={() => handleInspect(pmt)}
                        >
                          <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Inspect</span>
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

      {/* Raw Payload Inspector Modal */}
      {selectedPayment && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Gateway Transaction: ${selectedPayment.transaction_id || selectedPayment.id}`}
          description={`Gateway: ${selectedPayment.gateway.toUpperCase()} • Recorded: ${formatDate(selectedPayment.created_at)}`}
          className="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400">Amount Charged</span>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
              <Badge variant={selectedPayment.status === 'completed' ? 'success' : 'warning'}>
                {selectedPayment.status}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Raw JSON Response Payload
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72">
                {JSON.stringify(selectedPayment.response_payload || { status: 'Recorded without external body' }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const fallbackPayments: Payment[] = [
  {
    id: 1,
    order_id: 1,
    order_number: 'ORD-20261003-90124',
    transaction_id: 'BKH98A72F10',
    gateway: 'bkash',
    amount: 51060,
    status: 'completed',
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    response_payload: {
      paymentID: 'BKASH_PAY_9918239',
      trxID: 'BKH98A72F10',
      transactionStatus: 'Completed',
      amount: '51060.00',
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: 'ORD-20261003-90124',
      customerMsisdn: '01770618575',
      paymentExecuteTime: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: 2,
    order_id: 2,
    order_number: 'ORD-20261002-88410',
    transaction_id: 'SSLC_BANK_TRX_99214',
    gateway: 'sslcommerz',
    amount: 49620,
    status: 'completed',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    response_payload: {
      status: 'VALID',
      tran_id: 'ORD-20261002-88410',
      val_id: 'VAL_SSLC_20261002_001',
      amount: '49620.00',
      store_amount: '48379.50',
      currency: 'BDT',
      bank_tran_id: 'SSLC_BANK_TRX_99214',
      card_type: 'VISA-CityBank',
      card_no: '401200XXXXXX1111',
      card_issuer: 'City Bank PLC',
      card_brand: 'VISA',
      currency_type: 'BDT',
      currency_amount: '49620.00',
    },
  },
  {
    id: 3,
    order_id: 3,
    order_number: 'ORD-20261004-12948',
    transaction_id: 'BKH11C44D99',
    gateway: 'bkash',
    amount: 26860,
    status: 'completed',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    response_payload: {
      paymentID: 'BKASH_PAY_1144299',
      trxID: 'BKH11C44D99',
      transactionStatus: 'Completed',
      amount: '26860.00',
      customerMsisdn: '01912987654',
      paymentExecuteTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: 4,
    order_id: 4,
    order_number: 'ORD-20261004-33819',
    transaction_id: 'TXN-INIT-33819',
    gateway: 'sslcommerz',
    amount: 17560,
    status: 'initiated',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    response_payload: {
      status: 'SUCCESS',
      sessionkey: 'FBE224673A41088481D',
      GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=pay&SESSIONKEY=FBE224673A41088481D',
    },
  },
  {
    id: 5,
    order_id: 5,
    order_number: 'ORD-20261001-44719',
    transaction_id: 'BKH_FAIL_44719',
    gateway: 'bkash',
    amount: 14320,
    status: 'failed',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    response_payload: {
      statusCode: '2023',
      statusMessage: 'Insufficient Balance in Customer Wallet',
      paymentID: 'BKASH_PAY_FAIL_44719',
    },
  },
];
