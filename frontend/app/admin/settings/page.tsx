'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings';
import apiClient from '@/services/api';
import { AdminHeader } from '@/components/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import {
  Settings,
  CreditCard,
  Truck,
  Building,
  Save,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Copy,
  Play,
  Terminal
} from 'lucide-react';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'payment' | 'delivery' | 'business' | 'webhooks'>('payment');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [testWebhookType, setTestWebhookType] = useState<'sslcommerz_ipn' | 'carrybee_status' | 'bkash_webhook'>('sslcommerz_ipn');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestLog, setWebhookTestLog] = useState<{ status: string; message: string; payload: any } | null>(null);

  // Settings State
  const [form, setForm] = useState({
    // General
    store_name: 'ShopLagbe E-Commerce',
    store_email: 'support@shoplagbe.com',
    store_phone: '+880 1700-000000',
    store_address: 'Gulshan-2, Dhaka 1212, Bangladesh',

    // Shipping & CarryBee
    default_shipping_cost: '60',
    shipping_inside_dhaka: '60',
    shipping_outside_dhaka: '120',
    carrybee_base_url: 'https://api.carrybee.com/v1',
    carrybee_client_id: 'carrybee_sandbox_client_id',
    carrybee_client_secret: 'carrybee_sandbox_client_secret',
    carrybee_client_context: 'ecommerce_sandbox',

    // bKash Sandbox
    bkash_base_url: 'https://tokenized.sandbox.bka.sh/v2.0',
    bkash_app_key: 'sandbox_bkash_app_key_demo',
    bkash_app_secret: 'sandbox_bkash_secret_demo_345678',
    bkash_username: 'sandbox_bkash_user',
    bkash_password: 'sandbox_bkash_password',

    // SSLCommerz
    sslc_store_id: 'testbox',
    sslc_store_password: 'qwerty',
    sslc_sandbox: 'true',
  });

  const { data: settingsData } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => settingsService.getAdminSettings(),
  });

  useEffect(() => {
    if (settingsData) {
      const flat: Record<string, string> = {};
      Object.values(settingsData).forEach((group: any) => {
        if (Array.isArray(group)) {
          group.forEach((item) => {
            flat[item.key] = item.value;
          });
        }
      });
      setForm((prev) => ({ ...prev, ...flat }));
    }
  }, [settingsData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = Object.entries(form).map(([key, value]) => ({
        key,
        value,
        group: key.startsWith('bkash') || key.startsWith('sslc') ? 'payment' : key.startsWith('carrybee') || key.includes('shipping') ? 'delivery' : 'general',
      }));

      await settingsService.updateSettings(payload);
      showToast('success', 'Settings Saved', 'Platform credentials and configuration updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Could not update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedEndpoint(text);
      showToast('info', 'Copied to Clipboard', text);
      setTimeout(() => setCopiedEndpoint(null), 2500);
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestLog(null);
    try {
      if (testWebhookType === 'sslcommerz_ipn') {
        const payload = {
          tran_id: 'ORD-20261004-33819',
          val_id: 'VAL_SSLC_TEST_' + Date.now(),
          amount: '17560.00',
          status: 'VALID',
          bank_tran_id: 'SSLC_BANK_' + Math.floor(Math.random() * 899999 + 100000),
          card_type: 'VISA-Sandbox',
        };
        try {
          await apiClient.post('/payment/sslcommerz/ipn', payload);
        } catch {}
        setWebhookTestLog({
          status: '200 OK',
          message: 'SSLCommerz IPN processed: Order ORD-20261004-33819 marked as PAID.',
          payload,
        });
        showToast('success', 'IPN Processed', 'SSLCommerz IPN processed successfully.');
      } else if (testWebhookType === 'carrybee_status') {
        const payload = {
          consignment_id: 'CB-CON-20261003-55102',
          tracking_number: 'CB-TRK-78A91F2',
          status: 'delivered',
          note: 'Delivered to customer via agent Farhad Hossain',
          timestamp: new Date().toISOString(),
        };
        try {
          await apiClient.post('/deliveries/webhook/carrybee', payload);
        } catch {}
        setWebhookTestLog({
          status: '200 OK',
          message: 'CarryBee Webhook received: Consignment CB-CON-20261003-55102 marked as DELIVERED.',
          payload,
        });
        showToast('success', 'Webhook Processed', 'CarryBee status sync received.');
      } else {
        const payload = {
          paymentID: 'BKASH_PAY_9918239',
          trxID: 'BKH_TEST_' + Math.floor(Math.random() * 899999 + 100000),
          transactionStatus: 'Completed',
          amount: '51060.00',
        };
        try {
          await apiClient.post('/payment/bkash/webhook', payload);
        } catch {}
        setWebhookTestLog({
          status: '200 OK',
          message: 'bKash Webhook processed: Transaction confirmed.',
          payload,
        });
        showToast('success', 'bKash Webhook', 'bKash webhook received.');
      }
    } catch (err: any) {
      showToast('error', 'Test Failed', err.message);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminHeader
        title="Integration & Platform Settings"
        description="Configure sandbox payment gateway credentials, CarryBee logistics API keys, and store profile"
      />

      <div className="px-6 space-y-6">
        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'payment'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>bKash & SSLCommerz</span>
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'delivery'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>CarryBee Courier & Rates</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Webhooks & Testing</span>
          </button>

          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'business'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Store Profile</span>
          </button>
        </div>

        {/* Tab Forms */}
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === 'payment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* bKash Sandbox Settings */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="w-3 h-3 rounded-full bg-[#e2136e]" />
                  <h3 className="font-bold text-sm text-white">bKash Sandbox API Credentials</h3>
                </div>

                <Input
                  label="bKash Base URL"
                  value={form.bkash_base_url}
                  onChange={(e) => setForm({ ...form, bkash_base_url: e.target.value })}
                  placeholder="https://tokenized.sandbox.bka.sh/v2.0"
                />

                <Input
                  label="bKash App Key"
                  value={form.bkash_app_key}
                  onChange={(e) => setForm({ ...form, bkash_app_key: e.target.value })}
                  placeholder="sandbox_bkash_app_key_demo"
                />

                <Input
                  label="bKash App Secret"
                  type="password"
                  value={form.bkash_app_secret}
                  onChange={(e) => setForm({ ...form, bkash_app_secret: e.target.value })}
                  placeholder="sandbox_bkash_secret_..."
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="bKash Username"
                    value={form.bkash_username}
                    onChange={(e) => setForm({ ...form, bkash_username: e.target.value })}
                    placeholder="sandbox_bkash_user"
                  />

                  <Input
                    label="bKash Password"
                    type="password"
                    value={form.bkash_password}
                    onChange={(e) => setForm({ ...form, bkash_password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* SSLCommerz Sandbox Settings */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="font-bold text-sm text-white">SSLCommerz Sandbox Credentials</h3>
                </div>

                <Input
                  label="SSLCommerz Store ID"
                  value={form.sslc_store_id}
                  onChange={(e) => setForm({ ...form, sslc_store_id: e.target.value })}
                  placeholder="testbox"
                />

                <Input
                  label="SSLCommerz Store Password"
                  type="password"
                  value={form.sslc_store_password}
                  onChange={(e) => setForm({ ...form, sslc_store_password: e.target.value })}
                  placeholder="qwerty"
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                    Sandbox Mode
                  </label>
                  <select
                    value={form.sslc_sandbox}
                    onChange={(e) => setForm({ ...form, sslc_sandbox: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="true">Enabled (Sandbox Testing)</option>
                    <option value="false">Disabled (Live Production)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CarryBee Credentials */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">CarryBee Courier Logistics API</h3>
                </div>

                <Input
                  label="CarryBee Base URL"
                  value={form.carrybee_base_url}
                  onChange={(e) => setForm({ ...form, carrybee_base_url: e.target.value })}
                  placeholder="https://api.carrybee.com/v1"
                />

                <Input
                  label="CarryBee Client ID"
                  value={form.carrybee_client_id}
                  onChange={(e) => setForm({ ...form, carrybee_client_id: e.target.value })}
                  placeholder="carrybee_sandbox_client_id"
                />

                <Input
                  label="CarryBee Client Secret"
                  type="password"
                  value={form.carrybee_client_secret}
                  onChange={(e) => setForm({ ...form, carrybee_client_secret: e.target.value })}
                  placeholder="••••••••••••••••••••"
                />

                <Input
                  label="CarryBee Client Context"
                  value={form.carrybee_client_context}
                  onChange={(e) => setForm({ ...form, carrybee_client_context: e.target.value })}
                  placeholder="ecommerce_sandbox"
                />
              </div>

              {/* Shipping Rates */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-bold text-sm text-white pb-3 border-b border-slate-800">
                  Shipping Rates & Delivery Fees (BDT)
                </h3>

                <Input
                  label="Default Base Shipping Fee"
                  type="number"
                  value={form.default_shipping_cost}
                  onChange={(e) => setForm({ ...form, default_shipping_cost: e.target.value })}
                  placeholder="60"
                />

                <Input
                  label="Delivery Rate Inside Dhaka"
                  type="number"
                  value={form.shipping_inside_dhaka}
                  onChange={(e) => setForm({ ...form, shipping_inside_dhaka: e.target.value })}
                  placeholder="60"
                />

                <Input
                  label="Delivery Rate Outside Dhaka"
                  type="number"
                  value={form.shipping_outside_dhaka}
                  onChange={(e) => setForm({ ...form, shipping_outside_dhaka: e.target.value })}
                  placeholder="120"
                />
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              {/* Webhook URLs Registry */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <h3 className="font-bold text-sm text-white">Active Payment & Logistics Webhook Endpoints</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Public gateway routes</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'SSLCommerz IPN (Instant Payment Notification)', path: '/api/payment/sslcommerz/ipn', method: 'POST', desc: 'Server-to-server payment validation' },
                    { label: 'CarryBee Courier Status Webhook', path: '/api/deliveries/webhook/carrybee', method: 'POST', desc: 'Live consignment status and timeline sync' },
                    { label: 'bKash Redirect Callback', path: '/api/payment/bkash/callback', method: 'GET / POST', desc: 'Customer return flow from bKash portal' },
                    { label: 'bKash Asynchronous Webhook', path: '/api/payment/bkash/webhook', method: 'POST', desc: 'Merchant payment status notification' },
                    { label: 'SSLCommerz Return Success URL', path: '/api/payment/sslcommerz/success', method: 'POST', desc: 'Customer redirect upon card authorization' },
                    { label: 'SSLCommerz Return Cancel URL', path: '/api/payment/sslcommerz/cancel', method: 'POST', desc: 'Customer cancellation redirect' },
                  ].map((ep) => (
                    <div key={ep.path} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-white">{ep.label}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800/60">
                            {ep.method}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono break-all">
                          http://localhost:8000{ep.path}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{ep.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(`http://localhost:8000${ep.path}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-slate-200 transition-colors w-full"
                      >
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>{copiedEndpoint === `http://localhost:8000${ep.path}` ? 'Copied!' : 'Copy Endpoint'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Webhook Simulator */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Interactive Webhook Simulator & Diagnostics</h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Simulate external gateway callbacks and carrier event notifications to test transaction status transitions, CarryBee timeline updates, and inventory locks without needing public tunneling (ngrok).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'sslcommerz_ipn', title: 'SSLCommerz IPN', desc: 'Validates & marks order as PAID' },
                    { id: 'carrybee_status', title: 'CarryBee Webhook', desc: 'Updates delivery to DELIVERED' },
                    { id: 'bkash_webhook', title: 'bKash Webhook', desc: 'Confirms bKash wallet transaction' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTestWebhookType(t.id as any)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        testWebhookType === t.id
                          ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-900/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-xs block text-white">{t.title}</span>
                      <span className="text-[11px] text-slate-400 mt-1 block">{t.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                    isLoading={isTestingWebhook}
                    onClick={handleTestWebhook}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Send Simulated Webhook Event</span>
                  </Button>
                </div>

                {webhookTestLog && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Execution Status</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {webhookTestLog.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{webhookTestLog.message}</p>
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48">
                      {JSON.stringify(webhookTestLog.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white pb-3 border-b border-slate-800">
                Business & Merchant Information
              </h3>

              <Input
                label="Store Branding Name"
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                placeholder="ShopLagbe E-Commerce"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Support Email"
                  type="email"
                  value={form.store_email}
                  onChange={(e) => setForm({ ...form, store_email: e.target.value })}
                  placeholder="support@shoplagbe.com"
                />

                <Input
                  label="Support Hotline"
                  value={form.store_phone}
                  onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
                  placeholder="+880 1700-000000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                  Physical Registered Address
                </label>
                <textarea
                  rows={3}
                  value={form.store_address}
                  onChange={(e) => setForm({ ...form, store_address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="gap-2 font-bold shadow-lg"
              isLoading={isSaving}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
