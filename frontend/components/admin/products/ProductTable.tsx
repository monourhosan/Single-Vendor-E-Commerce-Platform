'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StockBadge } from './StockBadge';
import { Badge } from '@/components/ui/Badge';
import { Edit2, Trash2, Boxes, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete: (product: Product) => void;
  onQuickInventory: (product: Product) => void;
}

export function ProductTable({
  products,
  isLoading,
  onDelete,
  onQuickInventory,
}: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-slate-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800/60 rounded w-1/2" />
              </div>
              <div className="w-20 h-4 bg-slate-800 rounded" />
              <div className="w-24 h-4 bg-slate-800 rounded" />
              <div className="w-20 h-8 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Boxes className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white">No Products Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No catalog items match your search or filter settings. Try adjusting your query or create a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-6">Product Item</th>
              <th className="py-3.5 px-6">SKU</th>
              <th className="py-3.5 px-6">Price</th>
              <th className="py-3.5 px-6">Stock Level</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Created Date</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                {/* Image & Title */}
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0 max-w-xs">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-semibold text-white hover:text-sky-400 transition-colors truncate block"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {product.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="py-3.5 px-6 font-mono text-[11px] font-semibold text-sky-400">
                  {product.sku}
                </td>

                {/* Price */}
                <td className="py-3.5 px-6 font-bold text-white whitespace-nowrap">
                  {formatCurrency(product.price)}
                </td>

                {/* Stock Level */}
                <td className="py-3.5 px-6 whitespace-nowrap">
                  <StockBadge quantity={product.stock_quantity} />
                </td>

                {/* Status */}
                <td className="py-3.5 px-6 whitespace-nowrap">
                  <Badge
                    variant={
                      product.status === 'active'
                        ? 'success'
                        : product.status === 'inactive'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {product.status}
                  </Badge>
                </td>

                {/* Created Date */}
                <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {formatDate(product.created_at)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Quick Inventory Adjustment */}
                    <button
                      onClick={() => onQuickInventory(product)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Quick Adjust Stock"
                    >
                      <Boxes className="w-4 h-4" />
                    </button>

                    {/* Dedicated Inventory Audit Page */}
                    <Link
                      href={`/admin/products/${product.id}/inventory`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                      title="View Inventory History & Analytics"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {/* Edit Product */}
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Product Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>

                    {/* Delete Product */}
                    <button
                      onClick={() => onDelete(product)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Safe Delete / Archive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
