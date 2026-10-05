import { getBkashConfig, isSimulatedId } from './client';
import { getBkashToken, invalidateBkashToken } from './token';
import { BkashRefundPayload, BkashRefundResponse } from '@/types/payment';

/**
 * Refund a completed bKash payment transaction.
 */
export async function refundBkashPayment(input: BkashRefundPayload): Promise<BkashRefundResponse> {
  const config = getBkashConfig();

  // If this was a simulated sandbox transaction
  if (isSimulatedId(input.paymentID) || (input.trxID && input.trxID.startsWith('TRX_BKASH_'))) {
    const mockRefundTrxId = `REF_BKASH_${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      statusCode: '0000',
      statusMessage: 'Successful',
      originalTrxID: input.trxID,
      refundTrxID: mockRefundTrxId,
      transactionStatus: 'Completed',
      amount: Number(input.amount).toFixed(2),
      currency: 'BDT',
      completedTime: new Date().toISOString(),
    };
  }

  const idToken = await getBkashToken();

  const payload = {
    paymentID: input.paymentID,
    amount: Number(input.amount).toFixed(2),
    trxID: input.trxID,
    sku: input.sku || 'order_refund',
    reason: input.reason || 'Customer requested order refund',
  };

  try {
    const response = await fetch(config.refundUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: idToken,
        'X-APP-Key': config.appKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (response.status === 401) {
      invalidateBkashToken();
    }

    const data = await response.json();

    if (data.statusCode === '0000') {
      return {
        statusCode: data.statusCode,
        statusMessage: data.statusMessage || 'Successful',
        originalTrxID: data.originalTrxID || input.trxID,
        refundTrxID: data.refundTrxID || `REF_${Date.now()}`,
        transactionStatus: data.transactionStatus || 'Completed',
        amount: data.amount || Number(input.amount).toFixed(2),
        currency: data.currency || 'BDT',
        completedTime: data.completedTime || new Date().toISOString(),
      };
    }

    console.warn('[bKash Refund] Upstream returned non-zero status:', data);

    return {
      statusCode: data.statusCode || '2064',
      statusMessage: data.statusMessage || 'Refund transaction declined',
      originalTrxID: input.trxID,
      refundTrxID: '',
      transactionStatus: 'Failed',
      amount: Number(input.amount).toFixed(2),
    };
  } catch (error: any) {
    console.error('[bKash Refund] Network error issuing refund:', error.message);

    return {
      statusCode: '5000',
      statusMessage: error.message || 'Refund connection failed',
      originalTrxID: input.trxID,
      refundTrxID: '',
      transactionStatus: 'Failed',
      amount: Number(input.amount).toFixed(2),
    };
  }
}
