'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Product } from '@/types';
import { useAddInventory, useRemoveInventory } from '@/hooks/admin/useInventory';
import { PlusCircle, MinusCircle, AlertCircle, ArrowRight, Package } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: () => void;
}

const ADD_REASONS = [
  'Supplier shipment',
  'New stock',
  'Purchase return restock',
  'Warehouse inventory recount',
];

const REMOVE_REASONS = [
  'Damaged product',
  'Manual correction',
  'Internal sample / display',
  'Damaged in transit / packaging',
  'Expired or defective scrap',
];

export function InventoryModal({ isOpen, onClose, product, onSuccess }: InventoryModalProps) {
  const [action, setAction] = useState<'ADD' | 'REMOVE'>('ADD');
  const [quantity, setQuantity] = useState<string>('5');
  const [reason, setReason] = useState<string>('Supplier shipment');
  const [customReason, setCustomReason] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const addMutation = useAddInventory(product?.id);
  const removeMutation = useRemoveInventory(product?.id);

  useEffect(() => {
    if (isOpen) {
      setAction('ADD');
      setQuantity('5');
      setReason(ADD_REASONS[0]);
      setCustomReason('');
      setIsCustom(false);
    }
  }, [isOpen, product]);

  const handleActionChange = (newAction: 'ADD' | 'REMOVE') => {
    setAction(newAction);
    const defaultReasons = newAction === 'ADD' ? ADD_REASONS : REMOVE_REASONS;
    setReason(defaultReasons[0]);
    setIsCustom(false);
    setCustomReason('');
  };

  const parsedQty = parseInt(quantity, 10) || 0;
  const currentStock = product?.stock_quantity ?? 0;
  const projectedStock =
    action === 'ADD' ? currentStock + parsedQty : currentStock - parsedQty;

  const isInsufficient = action === 'REMOVE' && parsedQty > currentStock;
  const isInvalidQty = parsedQty <= 0;
  const finalReason = isCustom ? customReason.trim() : reason;
  const isReasonEmpty = !finalReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || isInsufficient || isInvalidQty || isReasonEmpty) return;

    try {
      if (action === 'ADD') {
        await addMutation.mutateAsync({
          id: product.id,
          quantity: parsedQty,
          reason: finalReason,
        });
      } else {
        await removeMutation.mutateAsync({
          id: product.id,
          quantity: parsedQty,
          reason: finalReason,
        });
      }

      onClose();
      onSuccess?.();
    } catch (err) {
      // Toast handled by hook
    }
  };

  const isPending = addMutation.isPending || removeMutation.isPending;

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory Stock Adjustment"
      description={`Adjust real-time stock levels for "${product.name}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Stock Overview */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-sky-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]">
                {product.name}
              </p>
              <p className="text-[11px] font-mono text-slate-400">SKU: {product.sku}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Current Stock</p>
            <p className="text-sm font-bold text-white font-mono">{currentStock} units</p>
          </div>
        </div>

        {/* Action Selector: ADD vs REMOVE */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
            Adjustment Action
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleActionChange('ADD')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                action === 'ADD'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Stock (Stock-In)</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionChange('REMOVE')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                action === 'REMOVE'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              <span>Remove Stock (Stock-Out)</span>
            </button>
          </div>
        </div>

        {/* Quantity Field & Quick Pills */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
            Quantity to {action === 'ADD' ? 'Add' : 'Deduct'}
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              max={action === 'REMOVE' ? currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              required
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Quick set:</span>
            {[5, 10, 25, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuantity(num.toString())}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                +{num}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
            Reason for Adjustment
          </label>
          <select
            value={isCustom ? 'custom' : reason}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setIsCustom(true);
              } else {
                setIsCustom(false);
                setReason(e.target.value);
              }
            }}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {(action === 'ADD' ? ADD_REASONS : REMOVE_REASONS).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="custom">Other / Custom Reason...</option>
          </select>

          {isCustom && (
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Type detailed reason for audit trail..."
              required
              className="mt-2"
            />
          )}
        </div>

        {/* Stock Impact Preview */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Projected Resulting Stock:</span>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-400">{currentStock}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span
              className={`font-bold ${
                projectedStock < 0
                  ? 'text-rose-400 font-extrabold'
                  : action === 'ADD'
                  ? 'text-emerald-400'
                  : 'text-sky-400'
              }`}
            >
              {projectedStock} units
            </span>
          </div>
        </div>

        {/* Insufficient Stock Warning */}
        {isInsufficient && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Cannot reduce below zero. Current stock is {currentStock} units.</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={action === 'ADD' ? 'primary' : 'danger'}
            size="sm"
            isLoading={isPending}
            disabled={isInsufficient || isInvalidQty || isReasonEmpty}
          >
            {action === 'ADD' ? 'Confirm Restock' : 'Confirm Deduction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
