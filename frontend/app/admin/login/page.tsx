'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('admin@shoplagbe.com');
  const [password, setPassword] = useState('admin123456');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminLogin(email, password);
      showToast('success', 'Authenticated', 'Welcome to the ShopLagbe Admin Dashboard.');
      router.push('/admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid administrator credentials.';
      showToast('error', 'Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-sky-500/20">
            SL
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Portal Login</h1>
          <p className="text-xs text-slate-400">
            Sign in to manage products, orders, payments, and CarryBee deliveries.
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shoplagbe.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full gap-2 font-bold shadow-lg shadow-sky-500/20"
              isLoading={isLoading}
            >
              <span>Authenticate Session</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Preset Helper */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Default Demo Credentials:</p>
            <p className="font-mono text-[11px]">Email: <span className="text-sky-400">admin@shoplagbe.com</span></p>
            <p className="font-mono text-[11px]">Password: <span className="text-sky-400">admin123456</span></p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
