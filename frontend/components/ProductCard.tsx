'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Eye, Check } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [added, setAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.in_stock) return;
    addToCart(product, 1);
    setAdded(true);
    showToast('success', 'Added to cart', `${product.name} added to your shopping bag.`);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-sky-950/20 flex flex-col justify-between overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {!product.in_stock ? (
            <Badge variant="danger">Out of Stock</Badge>
          ) : product.is_low_stock ? (
            <Badge variant="warning">Only {product.stock_quantity} Left</Badge>
          ) : (
            <Badge variant="success">In Stock</Badge>
          )}
        </div>

        <span className="absolute top-3 right-3 text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-slate-400 border border-slate-800">
          {product.sku}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-semibold text-slate-100 hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description || 'Authentic original product backed by manufacturer warranty.'}
          </p>
        </div>

        {/* Price and Cart Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Price</span>
            <span className="text-base font-bold text-sky-400">
              {formatCurrency(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/products/${product.id}`}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="View Product Details"
            >
              <Eye className="w-4 h-4" />
            </Link>

            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock}
              className={`p-2 rounded-xl font-medium text-xs flex items-center gap-1 transition-all ${
                !product.in_stock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary hover:bg-sky-500 text-white shadow-md shadow-sky-500/20 active:scale-95'
              }`}
              title={product.in_stock ? 'Add to cart' : 'Out of stock'}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
