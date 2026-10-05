'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product';
import { Product } from '@/types';
import { useToast } from '@/hooks/useToast';

interface UpdateProductVariables {
  id: number | string;
  data: FormData | Partial<Product>;
}

export function useUpdateProduct(options?: { onSuccess?: (data: Product) => void; onError?: (error: any) => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateProductVariables) => {
      const response = await productService.updateProduct(id, data);
      return response.data as Product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', data.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('success', 'Product Updated', `"${data.name}" has been updated successfully.`);
      options?.onSuccess?.(data);
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update product.';
      showToast('error', 'Update Failed', message);
      options?.onError?.(err);
    },
  });
}
