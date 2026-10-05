import { getBkashConfig, isSimulatedId } from './client';
import { getBkashToken, invalidateBkashToken } from './token';
import { BkashExecuteResponse } from '@/types/payment';

/**
 * Execute and capture an authorized bKash payment.
 * Invoked once the customer submits OTP/PIN and is redirected to callback.
 */
export async function executeBkashPayment(paymentID: string): Promise<BkashExecuteResponse> {
  const config = getBkashConfig();

  // If this is a sandbox simulator transaction
  if (isSimulatedId(paymentID)) {
    const mockTrxId = `TRX_BKASH_${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      statusCode: '0000',
      statusMessage: 'Successful',
      paymentID,
      trxID: mockTrxId,
      transactionStatus: 'Completed',
      amount: '0.00',
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: '',
      customerMsisdn: '01770618575',
      paymentExecuteTime: new Date().toISOString(),
    };
  }

  const idToken = await getBkashToken();

  try {
    const response = await fetch(config.executePaymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: idToken,
        'X-APP-Key': config.appKey,
      },
      body: JSON.stringify({ paymentID }),
      cache: 'no-store',
    });

    if (response.status === 401) {
      invalidateBkashToken();
    }

    const data = await response.json();

    if (data.statusCode === '0000' && (data.transactionStatus === 'Completed' || data.trxID)) {
      return {
        statusCode: data.statusCode,
        statusMessage: data.statusMessage || 'Successful',
        paymentID: data.paymentID || paymentID,
        trxID: data.trxID,
        transactionStatus: data.transactionStatus || 'Completed',
        amount: data.amount || '0.00',
        currency: data.currency || 'BDT',
        intent: data.intent || 'sale',
        merchantInvoiceNumber: data.merchantInvoiceNumber || '',
        customerMsisdn: data.customerMsisdn,
        paymentExecuteTime: data.paymentExecuteTime || new Date().toISOString(),
      };
    }

    console.warn('[bKash Execute Payment] Upstream execution returned status:', data);

    return {
      statusCode: data.statusCode || '2023',
      statusMessage: data.statusMessage || 'Payment execution failed',
      paymentID,
      trxID: data.trxID || '',
      transactionStatus: data.transactionStatus || 'Failed',
      amount: data.amount || '0.00',
      currency: data.currency || 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: data.merchantInvoiceNumber || '',
    };
  } catch (error: any) {
    console.error('[bKash Execute Payment] Network error executing payment:', error.message);

    return {
      statusCode: '5000',
      statusMessage: error.message || 'Execution connection error',
      paymentID,
      trxID: '',
      transactionStatus: 'Failed',
      amount: '0.00',
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: '',
    };
  }
}
