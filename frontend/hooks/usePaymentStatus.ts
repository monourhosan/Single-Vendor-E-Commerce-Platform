'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';

export function usePaymentStatus(orderNumber?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['payment-status', orderNumber],
    queryFn: () => paymentService.getPaymentStatus(orderNumber!),
    enabled: !!orderNumber && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.paymentStatus === 'paid' || data?.paymentStatus === 'failed' || data?.paymentStatus === 'cancelled') {
        return false;
      }
      return 3000; // Poll every 3 seconds while in pending / initiated state
    },
    staleTime: 2000,
  });
}
