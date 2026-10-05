'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminHeader } from '@/components/AdminHeader';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { useCreateProduct } from '@/hooks/admin/useCreateProduct';
import { ArrowLeft, PackagePlus } from 'lucide-react';

export default function CreateProductPage() {
  const router = useRouter();

  const createMutation = useCreateProduct({
    onSuccess: () => {
      router.push('/admin/products');
    },
  });

  const handleFormSubmit = async (formData: FormData) => {
    await createMutation.mutateAsync(formData);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Navigation */}
      <AdminHeader
        title="Add New Product"
        description="Add fresh inventory items with SKU codes, pricing, specifications, and imagery"
      />

      <div className="px-6 space-y-4">
        {/* Breadcrumb Back Link */}
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products Catalog</span>
          </Link>
        </div>

        {/* Product Form */}
        <ProductForm onSubmit={handleFormSubmit} isLoading={createMutation.isPending} />
      </div>
    </div>
  );
}
