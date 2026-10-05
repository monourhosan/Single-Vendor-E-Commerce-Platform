'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, Smartphone, Lock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function PaymentSimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gateway = searchParams.get('gateway') || 'bkash';
  const paymentID = searchParams.get('paymentID') || 'SIM_' + Date.now();
  const orderNumber = searchParams.get('order') || 'ORD-DEMO-001';
  const amount = searchParams.get('amount') || '1500';

  // bKash simulation state
  const [bkashStep, setBkashStep] = useState<'phone' | 'otp' | 'pin'>('phone');
  const [phone, setPhone] = useState('01770618575');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('12121');
  const [isLoading, setIsLoading] = useState(false);

  const handleBkashSubmit = () => {
    if (bkashStep === 'phone') {
      setBkashStep('otp');
      return;
    }
    if (bkashStep === 'otp') {
      setBkashStep('pin');
      return;
    }
    if (bkashStep === 'pin') {
      setIsLoading(true);
      setTimeout(() => {
        // Redirect to Next.js App Router bKash callback route
        window.location.href = `/api/payment/bkash/callback?paymentID=${paymentID}&status=success&order_number=${orderNumber}`;
      }, 1000);
    }
  };

  const handleCancel = () => {
    window.location.href = `/api/payment/bkash/callback?paymentID=${paymentID}&status=cancel&order_number=${orderNumber}`;
  };

  const handleSSLSuccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = `/payment/success?order=${orderNumber}&trx=SSLC_TRX_${Date.now()}&gateway=sslcommerz`;
    }, 800);
  };

  const handleSSLFail = () => {
    window.location.href = `/payment/failure?order=${orderNumber}&gateway=sslcommerz&reason=declined_by_bank`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {gateway === 'bkash' ? (
        /* bKash Sandbox Simulator Screen */
        <div className="w-full max-w-sm rounded-3xl bg-[#e2136e] p-6 text-white shadow-2xl space-y-6 relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-block bg-white text-[#e2136e] font-extrabold text-xl px-4 py-1 rounded-xl shadow-md">
              bKash
            </div>
            <div className="text-xs bg-pink-800/60 rounded-full py-1 px-3 inline-block">
              Official Tokenized Sandbox API
            </div>
            <p className="text-xs text-pink-100">Merchant: ShopLagbe E-Commerce</p>
            <div className="pt-2">
              <span className="text-xs text-pink-200">Amount to Pay</span>
              <h2 className="text-3xl font-extrabold text-white">{formatCurrency(amount)}</h2>
            </div>
          </div>

          {/* Form Step */}
          <div className="bg-white rounded-2xl p-5 text-slate-900 space-y-4 shadow-lg">
            {bkashStep === 'phone' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Your bKash Account Number
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50">
                  <Smartphone className="w-4 h-4 text-[#e2136e]" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm font-semibold bg-transparent focus:outline-none"
                    placeholder="017XXXXXXXX"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Sandbox demo number: <strong className="text-[#e2136e]">01770618575</strong>
                </p>
              </div>
            )}

            {bkashStep === 'otp' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Verification Code (OTP)
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50">
                  <Lock className="w-4 h-4 text-[#e2136e]" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full text-sm font-semibold tracking-widest bg-transparent focus:outline-none"
                    placeholder="123456"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Sandbox default OTP: <strong className="text-[#e2136e]">123456</strong>
                </p>
              </div>
            )}

            {bkashStep === 'pin' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Enter bKash 5-Digit PIN
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50">
                  <Lock className="w-4 h-4 text-[#e2136e]" />
                  <input
                    type="password"
                    maxLength={5}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-sm font-semibold tracking-widest bg-transparent focus:outline-none"
                    placeholder="12121"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Sandbox test PIN: <strong className="text-[#e2136e]">12121</strong>
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleBkashSubmit}
                className="w-1/2 py-2.5 rounded-xl bg-[#e2136e] hover:bg-[#c70d5e] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {isLoading ? 'Executing...' : bkashStep === 'pin' ? 'Confirm Pay' : 'Next'}
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-pink-200">
            Order Reference: {orderNumber}
          </div>
        </div>
      ) : (
        /* SSLCommerz Sandbox Simulator Screen */
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-block bg-[#1e3a8a] text-white font-extrabold text-lg px-4 py-1 rounded-xl shadow-md">
              SSLCommerz Sandbox
            </div>
            <p className="text-xs text-slate-400">Payment Gateway Aggregator v4</p>
            <div className="pt-2">
              <span className="text-xs text-slate-400">Order #{orderNumber}</span>
              <h2 className="text-3xl font-extrabold text-sky-400">{formatCurrency(amount)}</h2>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase">Available Payment Channels</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 text-center font-medium hover:border-blue-500 cursor-pointer">
                💳 Visa / MasterCard
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 text-center font-medium hover:border-blue-500 cursor-pointer">
                📱 Nagad / Rocket
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 text-center font-medium hover:border-blue-500 cursor-pointer">
                🏦 City Touch Banking
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 text-center font-medium hover:border-blue-500 cursor-pointer">
                🏛️ Islami Bank i-Banking
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="sslcommerz"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              onClick={handleSSLSuccess}
            >
              Simulate Successful Payment
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full text-rose-400 hover:text-rose-300"
              onClick={handleSSLFail}
            >
              Simulate Payment Failure
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentSimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading Gateway Simulator...</div>}>
      <PaymentSimulatorContent />
    </Suspense>
  );
}
