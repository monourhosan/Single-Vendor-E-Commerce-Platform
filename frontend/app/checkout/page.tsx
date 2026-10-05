'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { orderService } from '@/services/order';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBkashPayment } from '@/hooks/useBkashPayment';
import { PaymentLoader } from '@/components/payment/PaymentLoader';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: z.string().email('Please enter a valid email address'),
  customer_phone: z
    .string()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, 'Valid Bangladeshi phone number required (e.g. 01712345678)'),
  delivery_address: z.string().min(6, 'Please provide full delivery address including house/road/area'),
  city: z.enum(['dhaka', 'outside_dhaka']),
  payment_gateway: z.enum(['bkash', 'sslcommerz', 'cod']),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bkashMutation = useBkashPayment();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      delivery_address: '',
      city: 'dhaka',
      payment_gateway: 'bkash',
    },
  });

  const selectedGateway = watch('payment_gateway');
  const selectedCity = watch('city');

  const shippingCost = selectedCity === 'dhaka' ? 60 : 120;
  const grandTotal = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400">Please add products to your cart before proceeding to checkout.</p>
        <Link href="/">
          <Button variant="primary" size="sm">Explore Products</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        delivery_address: `${data.delivery_address} (${data.city === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})`,
        payment_gateway: data.payment_gateway,
        shipping_cost: shippingCost,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      };

      // 1. Dedicated bKash Tokenized Checkout Flow
      if (data.payment_gateway === 'bkash') {
        const orderResult = await orderService.checkout({
          ...payload,
          defer_payment: true,
        });

        if (!orderResult.success) {
          showToast('error', 'Checkout Error', orderResult.message || 'Unable to create order. Please try again.');
          return;
        }

        const orderNumber = orderResult.order_number || orderResult.order?.order_number;

        const bkashSession = await bkashMutation.mutateAsync({
          orderNumber,
          amount: grandTotal,
          customerPhone: data.customer_phone,
        });

        if (bkashSession.bkashURL) {
          clearCart();
          window.location.href = bkashSession.bkashURL;
        } else {
          showToast('error', 'bKash Error', bkashSession.statusMessage || 'Unable to establish payment session.');
        }
        return;
      }

      // 2. Standard SSLCommerz / COD Checkout Flow
      const result = await orderService.checkout(payload);

      if (result.success && result.redirect_url) {
        showToast('success', 'Order Initiated', 'Redirecting to payment session...');
        clearCart();
        window.location.href = result.redirect_url;
      } else {
        showToast('error', 'Checkout Failed', result.message || 'Unable to process checkout.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit order. Please retry.';
      showToast('error', 'Checkout Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {bkashMutation.isPending && (
        <PaymentLoader
          isOverlay
          message="Connecting to bKash Gateway..."
          subMessage="Authorizing secure checkout session with bKash API"
        />
      )}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Express Checkout</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete shipping details and select your payment method
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Delivery & Gateway Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer & Shipping Address */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-semibold text-sm">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>1. Customer & Delivery Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Rahim Ahmed"
                error={errors.customer_name?.message}
                {...register('customer_name')}
              />

              <Input
                label="Phone Number (BD)"
                placeholder="017XXXXXXXX"
                error={errors.customer_phone?.message}
                helperText="Used for CarryBee delivery OTP"
                {...register('customer_phone')}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="rahim@gmail.com"
              error={errors.customer_email?.message}
              {...register('customer_email')}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Delivery Zone
              </label>
              <select
                {...register('city')}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
                <option value="dhaka">Inside Dhaka Metro (৳60 Shipping - Next Day CarryBee Delivery)</option>
                <option value="outside_dhaka">Outside Dhaka / Nationwide (৳120 Shipping - 2-3 Days)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Detailed Delivery Address
              </label>
              <textarea
                rows={3}
                placeholder="House #, Road #, Sector/Area, Landmark..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                {...register('delivery_address')}
              />
              {errors.delivery_address && (
                <p className="text-xs text-rose-400 font-medium">{errors.delivery_address.message}</p>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-semibold text-sm">
              <CreditCard className="w-4 h-4 text-pink-400" />
              <span>2. Select Payment Method</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* bKash Option */}
              <label
                onClick={() => setValue('payment_gateway', 'bkash')}
                className={`relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGateway === 'bkash'
                    ? 'bg-pink-950/30 border-[#e2136e] shadow-md shadow-pink-950/40 ring-1 ring-[#e2136e]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-600">
                    {selectedGateway === 'bkash' && (
                      <div className="w-3 h-3 rounded-full bg-[#e2136e]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">bKash Payment</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e2136e] text-white">
                        Sandbox Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fast mobile payment via official bKash Tokenized Sandbox API.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[#e2136e]">bKash</span>
              </label>

              {/* SSLCommerz Option */}
              <label
                onClick={() => setValue('payment_gateway', 'sslcommerz')}
                className={`relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGateway === 'sslcommerz'
                    ? 'bg-blue-950/30 border-blue-600 shadow-md shadow-blue-950/40 ring-1 ring-blue-600'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-600">
                    {selectedGateway === 'sslcommerz' && (
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">SSLCommerz Gateway</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-200">
                        Cards & Net Banking
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visa, MasterCard, Amex, Nagad, Rocket and Internet Banking.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-blue-400">SSL</span>
              </label>

              {/* Cash on Delivery Option */}
              <label
                onClick={() => setValue('payment_gateway', 'cod')}
                className={`relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGateway === 'cod'
                    ? 'bg-amber-950/30 border-amber-600 shadow-md shadow-amber-950/40 ring-1 ring-amber-600'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-600">
                    {selectedGateway === 'cod' && (
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Cash on Delivery (COD)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        CarryBee Courier
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pay cash to CarryBee delivery agent upon receiving the package.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-amber-400">COD</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Form: Order Summary & Trigger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 sticky top-24">
            <h2 className="text-base font-bold text-white flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-normal text-slate-400">{totalItems} items</span>
            </h2>

            {/* Line Items */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/60">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-950 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{product.name}</p>
                      <p className="text-slate-400 text-[11px]">Qty: {quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-200 shrink-0">
                    {formatCurrency(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Calculation */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CarryBee Express Delivery</span>
                <span className="font-semibold text-amber-400">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Grand Total</span>
                <span className="text-2xl font-extrabold text-sky-400">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant={selectedGateway === 'bkash' ? 'bkash' : selectedGateway === 'sslcommerz' ? 'sslcommerz' : 'primary'}
              size="lg"
              isLoading={isSubmitting}
              className="w-full gap-2 font-bold text-sm shadow-xl"
            >
              <Lock className="w-4 h-4" />
              <span>
                {selectedGateway === 'bkash'
                  ? 'Pay with bKash Sandbox'
                  : selectedGateway === 'sslcommerz'
                  ? 'Pay with SSLCommerz'
                  : 'Confirm Cash on Delivery'}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Concurrently locked inventory & encrypted sandbox tunnel</span>
            </div>
          </div>
        </div>
      </form>
    </div>
    </>
  );
}
