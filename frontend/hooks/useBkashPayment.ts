'use client';

import { useMutation } from '@tanstack/react-query';
import { paymentService, CreateBkashPaymentParams } from '@/services/payment.service';
import { BkashPaymentResponse } from '@/types/payment';
import { useToast } from './useToast';

export function useBkashPayment() {
  const { showToast } = useToast();

  return useMutation<BkashPaymentResponse, Error, CreateBkashPaymentParams>({
    mutationFn: async (params: CreateBkashPaymentParams) => {
      try {
        const response = await paymentService.createBkashPayment(params);
        return response;
      } catch (err: any) {
        let friendlyMessage = 'Unable to establish bKash payment session. Please try again.';

        const errorStatus = err.response?.status;
        const serverMessage = err.response?.data?.message || err.message;

        if (errorStatus === 401) {
          friendlyMessage = 'bKash security token expired or invalid. Please retry your request.';
        } else if (serverMessage?.toLowerCase().includes('network') || !err.response) {
          friendlyMessage = 'Network connection issue while communicating with bKash. Check your connection.';
        } else if (serverMessage?.toLowerCase().includes('duplicate')) {
          friendlyMessage = 'A transaction for this order is already in progress. Please check your order status.';
        } else if (serverMessage) {
          friendlyMessage = serverMessage;
        }

        throw new Error(friendlyMessage);
      }
    },
    onError: (error) => {
      showToast('error', 'bKash Gateway Error', error.message);
    },
  });
}
