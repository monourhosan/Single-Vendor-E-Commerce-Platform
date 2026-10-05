'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShoppingCart,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Plus,
  Minus,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-800 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-slate-800 rounded" />
            <div className="h-6 w-1/4 bg-slate-800 rounded" />
            <div className="h-24 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-slate-400">The product you are looking for is unavailable or has been archived.</p>
        <Link href="/">
          <Button variant="primary" size="sm">Back to Store</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast('success', 'Added to Cart', `${quantity}x ${product.name} added.`);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Gallery Image */}
        <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
            alt={product.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute top-4 left-4">
            {!product.in_stock ? (
              <Badge variant="danger">Out of Stock</Badge>
            ) : product.is_low_stock ? (
              <Badge variant="warning">Only {product.stock_quantity} Remaining</Badge>
            ) : (
              <Badge variant="success">In Stock & Ready to Ship</Badge>
            )}
          </div>
        </div>

        {/* Info & Purchase Area */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono tracking-wider text-sky-400 font-semibold uppercase">
              SKU: {product.sku}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Unit Price (BDT)</span>
              <span className="text-3xl font-extrabold text-sky-400">
                {formatCurrency(product.price)}
              </span>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Delivery from: </span>
              <strong className="text-amber-400 font-bold block">৳60 (CarryBee)</strong>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Product Overview</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description || 'Authentic high-end merchandise rigorously tested for standard compliance and maximum durability.'}
            </p>
          </div>

          {/* Quantity & Actions */}
          {product.in_stock && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-300">Quantity:</span>
                <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  (Max available: {product.stock_quantity})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 text-sky-400" />
                  <span>Add To Cart</span>
                </Button>

                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1 gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold shadow-lg shadow-sky-500/20"
                  onClick={handleBuyNow}
                >
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span>Buy Now</span>
                </Button>
              </div>
            </div>
          )}

          {/* Value Props */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">CarryBee Express</p>
                <p className="text-[11px]">Next-day in Dhaka</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">100% Original</p>
                <p className="text-[11px]">Official Warranty</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Easy Returns</p>
                <p className="text-[11px]">7-day replacement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
