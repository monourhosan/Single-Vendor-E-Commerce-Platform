import { NextRequest, NextResponse } from 'next/server';
import { refundBkashPayment } from '@/lib/bkash/refundPayment';
import { getBkashConfig } from '@/lib/bkash/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentID, trxID, amount, sku, reason, orderID } = body;

    if (!paymentID || !trxID || !amount) {
      return NextResponse.json(
        { success: false, message: 'paymentID, trxID, and amount are required for refund.' },
        { status: 400 }
      );
    }

    const config = getBkashConfig();

    // 1. Issue bKash API refund
    const refundResult = await refundBkashPayment({
      paymentID,
      trxID,
      amount,
      sku: sku || 'order_refund',
      reason: reason || 'Customer requested refund',
    });

    if (refundResult.transactionStatus === 'Completed' || refundResult.statusCode === '0000') {
      // 2. Synchronize refund with Laravel backend
      try {
        const authHeader = request.headers.get('authorization') || '';
        await fetch(`${config.backendApiUrl}/admin/payments/${paymentID}/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            refundTrxID: refundResult.refundTrxID,
            amount: refundResult.amount,
            reason: reason || 'Refund issued via bKash',
            order_id: orderID,
          }),
          cache: 'no-store',
        });
      } catch (syncErr: any) {
        console.warn('[bKash API refund] Laravel refund sync warning:', syncErr.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Refund completed successfully.',
        data: refundResult,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: refundResult.statusMessage || 'Refund could not be processed.',
        data: refundResult,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[bKash API refund] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Server error processing refund.',
      },
      { status: 500 }
    );
  }
}
