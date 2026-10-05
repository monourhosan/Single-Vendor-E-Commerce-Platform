'use client';

import React from 'react';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';

export interface PaymentLoaderProps {
  message?: string;
  subMessage?: string;
  isOverlay?: boolean;
}

export function PaymentLoader({
  message = 'Initiating Secure bKash Gateway...',
  subMessage = 'Encrypting transaction token and connecting to bKash authorization servers',
  isOverlay = false,
}: PaymentLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm mx-auto">
      {/* bKash Stylized Pulsing Icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-[#e2136e] flex items-center justify-center text-white shadow-xl shadow-pink-900/40 animate-pulse">
          <span className="text-2xl font-black">৳</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-[#e2136e] flex items-center justify-center text-white">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e2136e]" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-base text-white">{message}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{subMessage}</p>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-2">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>256-Bit SSL Encrypted Sandbox Gateway</span>
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-2 w-full max-w-sm">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
