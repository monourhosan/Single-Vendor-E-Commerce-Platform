/**
 * bKash Server-Side Gateway Client
 * Handles sensitive environment configuration, base URLs, and secure HTTP communication.
 * This file MUST ONLY be used on the server (API routes / server actions).
 */

export interface BkashConfig {
  baseUrl: string;
  username: string;
  password: string;
  appKey: string;
  appSecret: string;
  grantTokenUrl: string;
  createPaymentUrl: string;
  executePaymentUrl: string;
  refundUrl: string;
  appUrl: string;
  backendApiUrl: string;
}

export function getBkashConfig(): BkashConfig {
  const baseUrl = (process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v2.0').replace(/\/+$/, '');
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const backendApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

  return {
    baseUrl,
    username: process.env.BKASH_USERNAME || 'sandbox_bkash_user',
    password: process.env.BKASH_PASSWORD || 'sandbox_bkash_password',
    appKey: process.env.BKASH_APP_KEY || 'sandbox_bkash_app_key_demo',
    appSecret: process.env.BKASH_APP_SECRET || 'sandbox_bkash_secret_demo_345678',
    grantTokenUrl: process.env.BKASH_GRANT_TOKEN_URL || `${baseUrl}/token/grant`,
    createPaymentUrl: process.env.BKASH_CREATE_PAYMENT_URL || `${baseUrl}/tokenized/checkout/create`,
    executePaymentUrl: process.env.BKASH_EXECUTE_PAYMENT_URL || `${baseUrl}/tokenized/checkout/execute`,
    refundUrl: process.env.BKASH_REFUND_TRANSACTION_URL || `${baseUrl}/tokenized/checkout/payment/refund`,
    appUrl,
    backendApiUrl,
  };
}

/**
 * Checks whether an authorization or transaction ID is simulated.
 */
export function isSimulatedId(id?: string | null): boolean {
  if (!id) return false;
  return id.startsWith('SIM_') || id.startsWith('BKASH_DEMO') || id.startsWith('MOCK_') || id.startsWith('BKASH_MOCK');
}
