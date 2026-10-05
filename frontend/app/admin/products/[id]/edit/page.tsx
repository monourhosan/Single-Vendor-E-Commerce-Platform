'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AdminHeader } from '@/components/AdminHeader';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { useUpdateProduct } from '@/hooks/admin/useUpdateProduct';
import { productService } from '@/services/product';
import { Product } from '@/types';
import { ArrowLeft, Edit3, Boxes } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const { data: product, isLoading, isError } = useQuery<Product, Error>({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const data = await productService.getProduct(productId);
      return data;
    },
    enabled: !!productId,
  });

  const updateMutation = useUpdateProduct({
    onSuccess: () => {
      router.push('/admin/products');
    },
  });

  const handleFormSubmit = async (formData: FormData) => {
    if (!product) return;
    await updateMutation.mutateAsync({
      id: product.id,
      data: formData,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      <AdminHeader
        title={product ? `Edit "${product.name}"` : 'Edit Product'}
        description="Update pricing, specifications, catalog status, and replace product imagery"
      />

      <div className="px-6 space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products Catalog</span>
          </Link>

          {product && (
            <Link
              href={`/admin/products/${product.id}/inventory`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Manage Inventory Stock</span>
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-1/4" />
            <div className="h-10 bg-slate-800 rounded" />
            <div className="h-32 bg-slate-800 rounded" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <h3 className="text-sm font-semibold text-rose-400">Failed to Load Product</h3>
            <p className="text-xs text-slate-400 mt-1">
              Could not find product details for ID: {productId}. It might have been deleted or archived.
            </p>
            <Link
              href="/admin/products"
              className="inline-block mt-4 text-xs font-semibold text-sky-400 hover:underline"
            >
              Return to Catalog
            </Link>
          </div>
        )}

        {/* Form */}
        {product && (
          <ProductForm
            initialData={product}
            onSubmit={handleFormSubmit}
            isLoading={updateMutation.isPending}
            isEdit={true}
          />
        )}
      </div>
    </div>
  );
}
