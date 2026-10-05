'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AdminHeader } from '@/components/AdminHeader';
import { StockBadge } from '@/components/admin/products/StockBadge';
import { InventoryModal } from '@/components/admin/products/InventoryModal';
import { InventoryHistoryTable } from '@/components/admin/products/InventoryHistoryTable';
import { useInventoryHistory } from '@/hooks/admin/useInventory';
import { productService } from '@/services/product';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Boxes,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Edit2,
  Package,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function ProductInventoryPage() {
  const params = useParams();
  const productId = params?.id as string;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch product info
  const {
    data: product,
    isLoading: isProductLoading,
    refetch: refetchProduct,
  } = useQuery<Product, Error>({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      return await productService.getProduct(productId);
    },
    enabled: !!productId,
  });

  // Fetch inventory logs
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useInventoryHistory(productId);

  const handleAdjustmentSuccess = () => {
    refetchProduct();
    refetchHistory();
  };

  const currentStock = product?.stock_quantity ?? historyData?.product?.stock_quantity ?? 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <AdminHeader
        title={product ? `Inventory: ${product.name}` : 'Product Inventory Management'}
        description="Monitor real-time warehouse stock, execute atomic stock-in/stock-out, and audit complete adjustment history"
      />

      <div className="px-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products Catalog</span>
          </Link>

          {product && (
            <Link
              href={`/admin/products/${product.id}/edit`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Product Details</span>
            </Link>
          )}
        </div>

        {/* Product Details & Stock Overview Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                {product?.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-8 h-8 text-slate-600" />
                )}
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-bold text-white">
                  {product?.name || 'Loading product...'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded">
                    SKU: {product?.sku || '---'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-white">
                    {product ? formatCurrency(product.price) : '---'}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="capitalize text-slate-300">
                    Status: <span className="font-semibold text-emerald-400">{product?.status}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Current Stock Pill & Trigger */}
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Available Stock
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white font-mono">{currentStock}</span>
                  <StockBadge quantity={currentStock} />
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
                className="gap-2 ml-2"
              >
                <Boxes className="w-4 h-4" />
                <span>Adjust Stock</span>
              </Button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              All stock modifications use database row-locking and transactional isolation (SELECT FOR UPDATE) to guarantee race-condition prevention and negative stock enforcement.
            </span>
          </div>
        </div>

        {/* Audit Log Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Inventory Adjustment History
              </h3>
            </div>

            <button
              onClick={() => refetchHistory()}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHistoryFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <InventoryHistoryTable
            logs={historyData?.data || []}
            isLoading={isHistoryLoading}
          />
        </div>
      </div>

      {/* Adjustment Modal */}
      {product && (
        <InventoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </div>
  );
}
