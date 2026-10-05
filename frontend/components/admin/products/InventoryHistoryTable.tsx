'use client';

import React from 'react';
import { InventoryLog } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, History, User } from 'lucide-react';

interface InventoryHistoryTableProps {
  logs: InventoryLog[];
  isLoading?: boolean;
}

export function InventoryHistoryTable({ logs, isLoading }: InventoryHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <History className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-white">No Inventory History</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Stock level adjustments, orders, and restocks will appear here in chronological order.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-6">Timestamp</th>
              <th className="py-3.5 px-6">Event Type</th>
              <th className="py-3.5 px-6">Change</th>
              <th className="py-3.5 px-6">Stock Transition</th>
              <th className="py-3.5 px-6">Reason / Note</th>
              <th className="py-3.5 px-6">Adjusted By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log) => {
              const isPositive = log.quantity_change > 0;
              return (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>

                  <td className="py-3.5 px-6">
                    <span className="capitalize">
                      {log.type === 'restock' || log.quantity_change > 0 ? (
                        <Badge variant="success">Restock</Badge>
                      ) : log.type === 'reservation' ? (
                        <Badge variant="warning">Order Reserved</Badge>
                      ) : log.type === 'cancellation' ? (
                        <Badge variant="default">Order Cancelled</Badge>
                      ) : (
                        <Badge variant="danger">Manual Deduction</Badge>
                      )}
                    </span>
                  </td>

                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-1 font-mono font-bold">
                      {isPositive ? (
                        <span className="text-emerald-400 flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" />+{log.quantity_change}
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          {log.quantity_change}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-6 font-mono text-[11px]">
                    <span className="text-slate-400">{log.previous_quantity ?? '-'}</span>
                    <span className="text-slate-600 mx-1.5">➔</span>
                    <span className="text-white font-bold">{log.new_quantity ?? '-'}</span>
                  </td>

                  <td className="py-3.5 px-6 max-w-xs truncate text-slate-300">
                    {log.reason || 'Standard inventory operation'}
                  </td>

                  <td className="py-3.5 px-6 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{log.admin_name || 'System'}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
