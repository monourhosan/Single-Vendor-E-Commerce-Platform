'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product';
import { InventoryLog } from '@/types';
import { useToast } from '@/hooks/useToast';

export interface InventoryHistoryResponse {
  success: boolean;
  product: {
    id: number;
    name: string;
    sku: string;
    stock_quantity: number;
  };
  data: InventoryLog[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export function useInventoryHistory(productId: number | string, params?: { per_page?: number; page?: number }) {
  return useQuery<InventoryHistoryResponse, Error>({
    queryKey: ['inventory-history', productId, params],
    queryFn: async () => {
      const response = await productService.getInventoryHistory(productId, params);
      return response;
    },
    enabled: !!productId,
  });
}

export function useAddInventory(productId?: number | string, options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, quantity, reason }: { id?: number | string; quantity: number; reason: string }) => {
      const targetId = id ?? productId;
      if (!targetId) throw new Error('Product ID is required.');
      const response = await productService.addInventory(targetId, { quantity, reason });
      return response;
    },
    onSuccess: (data, variables) => {
      const targetId = variables.id ?? productId;
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', targetId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-history', targetId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('success', 'Stock Increased', data.message || 'Inventory added successfully.');
      options?.onSuccess?.(data);
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to add inventory.';
      showToast('error', 'Operation Failed', message);
      options?.onError?.(err);
    },
  });
}

export function useRemoveInventory(productId?: number | string, options?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, quantity, reason }: { id?: number | string; quantity: number; reason: string }) => {
      const targetId = id ?? productId;
      if (!targetId) throw new Error('Product ID is required.');
      const response = await productService.removeInventory(targetId, { quantity, reason });
      return response;
    },
    onSuccess: (data, variables) => {
      const targetId = variables.id ?? productId;
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', targetId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-history', targetId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('success', 'Stock Reduced', data.message || 'Inventory removed successfully.');
      options?.onSuccess?.(data);
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to remove inventory.';
      showToast('error', 'Operation Failed', message);
      options?.onError?.(err);
    },
  });
}

export function useInventory(productId?: number | string) {
  const addMutation = useAddInventory(productId);
  const removeMutation = useRemoveInventory(productId);

  return {
    addStock: addMutation.mutateAsync,
    removeStock: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
