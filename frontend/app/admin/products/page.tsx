'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/admin/useProducts';
import { useDeleteProduct } from '@/hooks/admin/useDeleteProduct';
import { ProductTable } from '@/components/admin/products/ProductTable';
import { DeleteProductDialog } from '@/components/admin/products/DeleteProductDialog';
import { InventoryModal } from '@/components/admin/products/InventoryModal';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import {
  Plus,
  Search,
  Filter,
  Boxes,
  AlertTriangle,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected product states for modals
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);

  const { products, meta, isLoading, isFetching, refetch } = useProducts({
    search: search.trim() || undefined,
    status: status !== 'all' ? status : undefined,
    low_stock: filterLowStock || undefined,
    page: currentPage,
    per_page: 12,
  });

  const deleteMutation = useDeleteProduct({
    onSuccess: () => {
      setDeletingProduct(null);
      refetch();
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    await deleteMutation.mutateAsync(deletingProduct.id);
  };

  // Compute stats from current data
  const totalProducts = meta.total || products.length;
  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <AdminHeader
        title="Product & Inventory Management"
        description="Oversee complete catalog merchandise, SKU codes, pricing, and real-time inventory adjustments"
      />

      <div className="px-6 space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Products
              </p>
              <p className="text-xl font-bold text-white font-mono">{totalProducts}</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Low Stock Items (≤ 5)
              </p>
              <p className="text-xl font-bold text-amber-400 font-mono">{lowStockCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Out of Stock
              </p>
              <p className="text-xl font-bold text-rose-400 font-mono">{outOfStockCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Controls & Filtering Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by title, SKU, or specs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Catalog Statuses</option>
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Low Stock Toggle Button */}
            <button
              onClick={() => {
                setFilterLowStock(!filterLowStock);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterLowStock
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alert</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Add Product Button */}
          <Link href="/admin/products/create" className="w-full md:w-auto shrink-0">
            <Button variant="primary" size="md" className="gap-2 w-full md:w-auto">
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Button>
          </Link>
        </div>

        {/* Product Table */}
        <ProductTable
          products={products}
          isLoading={isLoading}
          onDelete={(product) => setDeletingProduct(product)}
          onQuickInventory={(product) => setInventoryProduct(product)}
        />

        {/* Pagination Bar */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-400">
            <p>
              Showing page <span className="font-semibold text-white">{meta.current_page}</span> of{' '}
              <span className="font-semibold text-white">{meta.last_page}</span> ({meta.total} products)
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1 || isLoading}
                className="gap-1 px-2.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.last_page))}
                disabled={currentPage >= meta.last_page || isLoading}
                className="gap-1 px-2.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Adjust Inventory Modal */}
      <InventoryModal
        isOpen={!!inventoryProduct}
        onClose={() => setInventoryProduct(null)}
        product={inventoryProduct}
        onSuccess={() => refetch()}
      />

      {/* Safe Delete Dialog */}
      <DeleteProductDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        product={deletingProduct}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
