'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const shippingCost = items.length > 0 ? 60 : 0;
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-white">Your Cart is Empty</h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Explore our trending electronics, audio equipment and accessories to fill up your bag.
        </p>
        <Link href="/">
          <Button variant="primary" size="md">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Shopping Bag</h1>
          <p className="text-xs text-slate-400 mt-1">Review your selected items and quantities</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                  alt={product.name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-950 shrink-0"
                />
                <div className="min-w-0">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm font-semibold text-white hover:text-sky-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{product.sku}</p>
                  <p className="text-xs font-bold text-sky-400 mt-1">{formatCurrency(product.price)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6">
                <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.stock_quantity}
                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-white block">
                    {formatCurrency(product.price * quantity)}
                  </span>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="text-xs text-rose-400 hover:underline mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white pt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Order Summary Sidebar */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white">Order Summary</h2>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Items</span>
              <span className="font-semibold text-white">{totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CarryBee Delivery Fee</span>
              <span className="font-semibold text-amber-400">{formatCurrency(shippingCost)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-sm font-bold text-white">Grand Total</span>
            <span className="text-2xl font-extrabold text-sky-400">{formatCurrency(total)}</span>
          </div>

          <Link href="/checkout" className="block">
            <Button variant="primary" size="lg" className="w-full gap-2 font-bold">
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">⚡ Fast & Safe Delivery Guarantee</p>
            <p>Direct integration with CarryBee courier service with live consignment tracking.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
