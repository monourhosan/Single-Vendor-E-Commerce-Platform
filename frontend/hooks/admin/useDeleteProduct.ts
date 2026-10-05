'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product';
import { useToast } from '@/hooks/useToast';

export function useDeleteProduct(options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await productService.deleteProduct(id);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('success', 'Product Removed', data.message || 'Product was removed successfully.');
      options?.onSuccess?.(data);
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete product.';
      showToast('error', 'Delete Failed', message);
      options?.onError?.(err);
    },
  });
}
