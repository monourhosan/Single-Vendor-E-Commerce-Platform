import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, CreditCard, RotateCcw } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 mt-20">
      {/* Service Highlights */}
      <div className="border-b border-slate-800/80 py-8 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800/50 text-sky-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-200">Express Delivery</h5>
              <p className="text-xs text-slate-500">Fast CarryBee courier logistics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-950/60 border border-pink-800/50 text-pink-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-200">bKash & SSLCommerz</h5>
              <p className="text-xs text-slate-500">100% secure payment gateways</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-200">Original Products</h5>
              <p className="text-xs text-slate-500">Guaranteed authentic gadgets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-200">Easy Returns</h5>
              <p className="text-xs text-slate-500">7-day hassle-free return policy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
                SL
              </div>
              <span className="text-lg font-bold text-white tracking-tight">ShopLagbe</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The premier Bangladeshi full-stack e-commerce marketplace with automated CarryBee delivery booking, bKash Sandbox, and SSLCommerz payment integration.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Customer Service</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/track" className="hover:text-white transition-colors">Track Consignment</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">View Cart</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition-colors">Checkout</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Administration</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/admin/login" className="hover:text-white transition-colors">Admin Login</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              <li><Link href="/admin/orders" className="hover:text-white transition-colors">Manage Orders</Link></li>
              <li><Link href="/admin/products" className="hover:text-white transition-colors">Inventory & Products</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Payment & Courier Partners</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#e2136e]/20 text-[#e2136e] border border-[#e2136e]/40">
                bKash
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#1e3a8a]/40 text-blue-300 border border-blue-800">
                SSLCommerz
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                CarryBee Courier
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Cash on Delivery
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              All transactions are secured with sandbox token verification.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ShopLagbe Ltd. All rights reserved.</p>
          <p>Built with Next.js 15, Laravel 13, bKash & CarryBee API.</p>
        </div>
      </div>
    </footer>
  );
}
