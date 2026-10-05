import { NextRequest, NextResponse } from 'next/server';
import { createBkashPayment } from '@/lib/bkash/createPayment';
import { getBkashConfig } from '@/lib/bkash/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, amount, customerPhone } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'Order number is required to initiate bKash payment.' },
        { status: 400 }
      );
    }

    const config = getBkashConfig();

    // 1. Validate order with Laravel backend (authoritative source of truth)
    let authoritativeAmount = amount;
    let authoritativePhone = customerPhone;

    try {
      const orderRes = await fetch(`${config.backendApiUrl}/orders/${orderNumber}`, {
        cache: 'no-store',
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const order = orderData.data || orderData;

        if (order.payment_status === 'paid') {
          return NextResponse.json(
            { success: false, message: `Order ${orderNumber} has already been paid.` },
            { status: 400 }
          );
        }

        if (order.total) {
          authoritativeAmount = order.total;
        }
        if (order.customer_phone) {
          authoritativePhone = order.customer_phone;
        }
      }
    } catch (orderFetchErr: any) {
      console.warn('[bKash API create] Could not reach Laravel to verify order total:', orderFetchErr.message);
    }

    // 2. Generate bKash Tokenized Payment session
    const paymentResponse = await createBkashPayment({
      orderNumber,
      amount: authoritativeAmount || 1000,
      customerPhone: authoritativePhone,
    });

    // 3. Inform Laravel backend to record initiated payment
    try {
      await fetch(`${config.backendApiUrl}/payment/bkash/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentID: paymentResponse.paymentID,
          order_number: orderNumber,
          amount: authoritativeAmount,
        }),
        cache: 'no-store',
      });
    } catch (initErr: any) {
      console.warn('[bKash API create] Failed to sync initiated status with Laravel:', initErr.message);
    }

    return NextResponse.json({
      success: true,
      paymentID: paymentResponse.paymentID,
      bkashURL: paymentResponse.bkashURL,
      statusMessage: paymentResponse.statusMessage,
    });
  } catch (error: any) {
    console.error('[bKash API create] Exception:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to initiate bKash payment session.',
      },
      { status: 500 }
    );
  }
}
