'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product';
import { Product } from '@/types';
import { useToast } from '@/hooks/useToast';

export function useCreateProduct(options?: { onSuccess?: (data: Product) => void; onError?: (error: any) => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (payload: FormData | Partial<Product>) => {
      const response = await productService.createProduct(payload);
      return response.data as Product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('success', 'Product Created', `"${data.name}" has been added to the catalog.`);
      options?.onSuccess?.(data);
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create product.';
      showToast('error', 'Creation Failed', message);
      options?.onError?.(err);
    },
  });
}
