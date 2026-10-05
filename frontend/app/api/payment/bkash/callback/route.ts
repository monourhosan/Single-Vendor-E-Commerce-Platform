import { NextRequest, NextResponse } from 'next/server';
import { executeBkashPayment } from '@/lib/bkash/executePayment';
import { getBkashConfig } from '@/lib/bkash/client';

async function handleCallback(request: NextRequest) {
  const config = getBkashConfig();
  const searchParams = request.nextUrl.searchParams;

  // Extract parameters from URL query params or request body
  let paymentID = searchParams.get('paymentID') || searchParams.get('paymentId');
  let status = searchParams.get('status')?.toLowerCase() || '';
  let orderNumber = searchParams.get('order_number') || searchParams.get('order') || '';

  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.json();
        paymentID = body.paymentID || paymentID;
        status = (body.status || status).toLowerCase();
        orderNumber = body.order_number || body.order || orderNumber;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        paymentID = (formData.get('paymentID') as string) || paymentID;
        status = ((formData.get('status') as string) || status).toLowerCase();
        orderNumber = ((formData.get('order_number') as string) || (formData.get('order') as string) || orderNumber);
      }
    } catch (parseErr) {
      console.warn('[bKash Callback] Error parsing POST body:', parseErr);
    }
  }

  console.log(`[bKash Callback] Processing callback: PaymentID=${paymentID}, Status=${status}, Order=${orderNumber}`);

  // 1. Success Callback: Execute and Verify
  if (status === 'success' && paymentID) {
    try {
      const executeResult = await executeBkashPayment(paymentID);
      const effectiveOrderNumber = orderNumber || executeResult.merchantInvoiceNumber || 'ORD-DEMO';
      const trxId = executeResult.trxID || `TRX_${Date.now()}`;

      if (executeResult.transactionStatus === 'Completed' || executeResult.statusCode === '0000') {
        // Send payment confirmation & verification to Laravel backend
        try {
          await fetch(`${config.backendApiUrl}/payment/bkash/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentID,
              trxID: trxId,
              orderID: effectiveOrderNumber,
              amount: executeResult.amount,
              status: 'Completed',
            }),
            cache: 'no-store',
          });
        } catch (verifyErr: any) {
          console.error('[bKash Callback] Laravel verification dispatch error:', verifyErr.message);
        }

        // Redirect to success receipt page
        const successUrl = `${config.appUrl}/payment/success?order=${encodeURIComponent(effectiveOrderNumber)}&trx=${encodeURIComponent(trxId)}&gateway=bkash`;
        return NextResponse.redirect(successUrl);
      }

      // Execution failed
      try {
        await fetch(`${config.backendApiUrl}/payment/bkash/failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_number: effectiveOrderNumber,
            reason: executeResult.statusMessage || 'Execution failed',
          }),
          cache: 'no-store',
        });
      } catch (err: any) {
        console.warn('[bKash Callback] Laravel failure notify error:', err.message);
      }

      const failUrl = `${config.appUrl}/payment/failed?order=${encodeURIComponent(effectiveOrderNumber)}&gateway=bkash&reason=execution_failed`;
      return NextResponse.redirect(failUrl);
    } catch (execErr: any) {
      console.error('[bKash Callback] Execution exception:', execErr);
      const failUrl = `${config.appUrl}/payment/failed?order=${encodeURIComponent(orderNumber)}&gateway=bkash&reason=execution_error`;
      return NextResponse.redirect(failUrl);
    }
  }

  // 2. Customer Cancelled Payment
  if (status === 'cancel') {
    if (orderNumber) {
      try {
        await fetch(`${config.backendApiUrl}/payment/bkash/failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_number: orderNumber,
            reason: 'Payment cancelled by customer',
          }),
          cache: 'no-store',
        });
      } catch (cancelErr: any) {
        console.warn('[bKash Callback] Laravel cancel sync error:', cancelErr.message);
      }
    }

    const cancelUrl = `${config.appUrl}/payment/failed?order=${encodeURIComponent(orderNumber)}&gateway=bkash&reason=customer_cancelled`;
    return NextResponse.redirect(cancelUrl);
  }

  // 3. Payment Failed or Declined
  if (orderNumber) {
    try {
      await fetch(`${config.backendApiUrl}/payment/bkash/failed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          reason: 'bKash payment failed or declined',
        }),
        cache: 'no-store',
      });
    } catch (failErr: any) {
      console.warn('[bKash Callback] Laravel failure sync error:', failErr.message);
    }
  }

  const defaultFailUrl = `${config.appUrl}/payment/failed?order=${encodeURIComponent(orderNumber)}&gateway=bkash&reason=payment_declined`;
  return NextResponse.redirect(defaultFailUrl);
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}
