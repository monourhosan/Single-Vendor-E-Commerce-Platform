import { NextRequest, NextResponse } from 'next/server';
import { executeBkashPayment } from '@/lib/bkash/executePayment';
import { getBkashConfig } from '@/lib/bkash/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentID, orderID, amount } = body;

    if (!paymentID) {
      return NextResponse.json(
        { success: false, message: 'paymentID is required for execution.' },
        { status: 400 }
      );
    }

    const config = getBkashConfig();

    // 1. Execute payment with bKash API
    const executionResult = await executeBkashPayment(paymentID);

    if (executionResult.transactionStatus === 'Completed' || executionResult.statusCode === '0000') {
      // 2. Synchronize verification with Laravel backend
      let laravelSyncSuccess = false;
      try {
        const verifyRes = await fetch(`${config.backendApiUrl}/payment/bkash/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentID,
            trxID: executionResult.trxID,
            orderID: orderID || executionResult.merchantInvoiceNumber,
            amount: executionResult.amount || amount,
            status: 'Completed',
          }),
          cache: 'no-store',
        });

        if (verifyRes.ok) {
          laravelSyncSuccess = true;
        }
      } catch (syncErr: any) {
        console.warn('[bKash API execute] Laravel verification sync warning:', syncErr.message);
      }

      return NextResponse.json({
        success: true,
        trxID: executionResult.trxID,
        transactionStatus: executionResult.transactionStatus,
        paymentID: executionResult.paymentID,
        amount: executionResult.amount,
        merchantInvoiceNumber: executionResult.merchantInvoiceNumber,
        laravelVerified: laravelSyncSuccess,
      });
    }

    // Execution failed: notify Laravel to restore stock
    if (orderID) {
      try {
        await fetch(`${config.backendApiUrl}/payment/bkash/failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_number: orderID,
            reason: executionResult.statusMessage || 'Payment execution failed',
          }),
          cache: 'no-store',
        });
      } catch (err: any) {
        console.warn('[bKash API execute] Failed to inform Laravel of failure:', err.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: executionResult.statusMessage || 'Payment execution failed.',
        statusCode: executionResult.statusCode,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[bKash API execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Server error executing bKash payment.',
      },
      { status: 500 }
    );
  }
}
