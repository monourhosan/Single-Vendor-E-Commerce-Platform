'use client';

import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product';
import { Product } from '@/types';

export interface UseProductsParams {
  search?: string;
  status?: string;
  low_stock?: boolean;
  page?: number;
  per_page?: number;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export function useProducts(params: UseProductsParams = {}) {
  const query = useQuery<ProductsResponse, Error>({
    queryKey: ['admin-products', params],
    queryFn: async () => {
      const result = await productService.getAdminProducts(params);
      return result;
    },
    staleTime: 30 * 1000,
  });

  return {
    products: query.data?.data ?? [],
    meta: query.data?.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
