'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  product: Product | null;
  isLoading?: boolean;
}

export function DeleteProductDialog({
  isOpen,
  onClose,
  onConfirm,
  product,
  isLoading = false,
}: DeleteProductDialogProps) {
  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      description="Safe deletion audit and confirmation"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-rose-300">
              Are you sure you want to delete this product?
            </p>
            <p className="text-rose-300/80 leading-relaxed">
              You are about to delete <span className="font-bold text-white">"{product.name}"</span> (SKU:{' '}
              <span className="font-mono text-sky-300">{product.sku}</span>).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-slate-200">Safe Deletion Policy (SoftDeletes):</p>
            <p className="text-slate-400 leading-relaxed">
              If this product is associated with existing customer orders or inventory log history, it will be safely soft-deleted and marked as <span className="font-semibold text-amber-400">archived</span> to safeguard financial audits and invoice integrity.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="gap-1.5"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Deletion</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
