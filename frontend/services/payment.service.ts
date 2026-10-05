import axios from 'axios';
import {
  BkashPaymentResponse,
  BkashExecuteResponse,
  BkashRefundPayload,
  BkashRefundResponse,
  PaymentVerification,
} from '@/types/payment';

export interface CreateBkashPaymentParams {
  orderNumber: string;
  amount?: number | string;
  customerPhone?: string;
}

export interface ExecuteBkashPaymentParams {
  paymentID: string;
  orderID?: string;
  amount?: number | string;
}

export const paymentService = {
  /**
   * Initiate a bKash tokenized payment session on the Next.js server.
   */
  async createBkashPayment(params: CreateBkashPaymentParams): Promise<BkashPaymentResponse> {
    const response = await axios.post('/api/payment/bkash/create', params);
    return response.data;
  },

  /**
   * Execute and capture an authorized payment session.
   */
  async executeBkashPayment(params: ExecuteBkashPaymentParams): Promise<BkashExecuteResponse> {
    const response = await axios.post('/api/payment/bkash/execute', params);
    return response.data;
  },

  /**
   * Send payment confirmation and verification details.
   */
  async verifyBkashPayment(params: PaymentVerification): Promise<{ success: boolean; message: string; order?: any }> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const response = await axios.post(`${apiUrl}/payment/bkash/verify`, params);
    return response.data;
  },

  /**
   * Request a bKash refund through Next.js server API.
   */
  async refundBkashPayment(payload: BkashRefundPayload): Promise<BkashRefundResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('shoplagbe_token') : null;
    const response = await axios.post('/api/payment/bkash/refund', payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  },

  /**
   * Retrieve payment status by order number or payment ID.
   */
  async getPaymentStatus(orderNumber: string) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    try {
      const response = await axios.get(`${apiUrl}/orders/${orderNumber}`);
      const order = response.data.data || response.data;
      return {
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        latestPayment: order.latest_payment || order.payment,
      };
    } catch {
      return {
        paymentStatus: 'pending',
        orderStatus: 'pending',
        latestPayment: null,
      };
    }
  },
};
