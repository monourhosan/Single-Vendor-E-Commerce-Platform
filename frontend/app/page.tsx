'use client';

import React, { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { productService } from '@/services/product';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import { ShoppingBag, Sparkles, Filter, CheckCircle2, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';

const CATEGORIES = ['All', 'Audio', 'Wearables', 'Computing', 'Cameras', 'Accessories'];

function HomeContent() {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState('latest');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', searchParam, inStockOnly, sortOption],
    queryFn: () =>
      productService.getProducts({
        search: searchParam || undefined,
        in_stock_only: inStockOnly || undefined,
        sort: sortOption,
      }),
  });

  const products: Product[] = data?.data || [];

  // Filter client-side by category if applicable
  const filteredProducts = products.filter((p: Product) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Audio') return p.sku.startsWith('AUD') || p.sku.startsWith('SPK');
    if (selectedCategory === 'Wearables') return p.sku.startsWith('WCH');
    if (selectedCategory === 'Computing') return p.sku.startsWith('KEY') || p.sku.startsWith('PER');
    if (selectedCategory === 'Cameras') return p.sku.startsWith('CAM');
    if (selectedCategory === 'Accessories') return p.sku.startsWith('BAG') || p.sku.startsWith('PWR') || p.sku.startsWith('BK');
    return true;
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 py-16 sm:py-24">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Integrated with bKash Sandbox, SSLCommerz & CarryBee</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Next-Generation Gadgets Delivered To <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-300 bg-clip-text text-transparent">Your Doorstep</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            Experience lightning-fast e-commerce in Bangladesh. Lock inventory with database precision, pay via bKash Sandbox or SSLCommerz, and track your parcel through CarryBee Express.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#catalog"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-sky-500 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 transition-all active:scale-95"
            >
              Explore Products
            </a>
            <a
              href="/track"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              Track Existing Order
            </a>
          </div>

          {/* Trust badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Stock Locking
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-pink-400" /> bKash Sandbox & Cards
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-400" /> CarryBee Automated Logistics
            </span>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Controls: In-Stock Toggle & Sort */}
          <div className="flex items-center gap-4 shrink-0 self-end md:self-auto text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
              />
              <span>In-stock only</span>
            </label>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="latest">Latest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Search Notice */}
        {searchParam && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span>
              Search results for: <strong className="text-white font-semibold">"{searchParam}"</strong>
            </span>
            <a href="/" className="text-sky-400 hover:underline">
              Clear Search
            </a>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">No products found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No products match your current filters. Try resetting the category or search keywords.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('All');
                setInStockOnly(false);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8"><ProductSkeleton /></div>}>
      <HomeContent />
    </Suspense>
  );
}
