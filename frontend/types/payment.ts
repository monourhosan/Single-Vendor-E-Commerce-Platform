export interface BkashPaymentResponse {
  paymentID: string;
  bkashURL: string;
  statusMessage: string;
  statusCode?: string;
  merchantInvoiceNumber?: string;
  amount?: string;
  currency?: string;
}

export interface PaymentVerification {
  trxID: string;
  transactionStatus: string;
  paymentID: string;
  orderID?: string;
  amount?: string | number;
  status?: string;
}

export interface BkashTokenResponse {
  statusCode?: string;
  statusMessage?: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface BkashCreatePaymentPayload {
  orderNumber: string;
  amount: number | string;
  customerPhone?: string;
  callbackURL?: string;
}

export interface BkashExecuteResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  customerMsisdn?: string;
  paymentExecuteTime?: string;
}

export interface BkashRefundPayload {
  paymentID: string;
  trxID: string;
  amount: number | string;
  orderID?: string | number;
  sku?: string;
  reason?: string;
}

export interface BkashRefundResponse {
  statusCode: string;
  statusMessage: string;
  originalTrxID: string;
  refundTrxID: string;
  transactionStatus: string;
  amount: string;
  currency?: string;
  completedTime?: string;
}

export type PaymentGatewayType = 'bkash' | 'sslcommerz' | 'cod';
export type PaymentStatusType = 'initiated' | 'completed' | 'failed' | 'cancelled' | 'refunded';
