'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, X, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Product title must be at least 2 characters'),
  sku: z.string().min(2, 'SKU code is required and must be unique'),
  description: z.string().optional().default(''),
  price: z.coerce.number().gt(0, 'Price must be greater than 0 BDT'),
  stock_quantity: z.coerce.number().int().gte(0, 'Stock quantity cannot be negative'),
  status: z.enum(['active', 'inactive', 'archived']),
  image: z.string().optional().default(''),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit = false,
}: ProductFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      description: initialData?.description || '',
      price: initialData?.price || ('' as any),
      stock_quantity: initialData?.stock_quantity ?? (isEdit ? ('' as any) : 10),
      status: (initialData?.status as any) || 'active',
      image: initialData?.image || '',
    },
  });

  const generateRandomSKU = () => {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    setValue('sku', `SKU-${random}`, { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValue('image', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFormSubmit = async (values: ProductFormValues) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('sku', values.sku);
    formData.append('description', values.description || '');
    formData.append('price', values.price.toString());
    formData.append('stock_quantity', values.stock_quantity.toString());
    formData.append('status', values.status);

    if (selectedFile) {
      formData.append('image_file', selectedFile);
    } else if (values.image) {
      formData.append('image', values.image);
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              General Information
            </h3>

            {/* Product Title */}
            <div>
              <Input
                label="Product Title"
                placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>

            {/* SKU and Generator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                  SKU Code (Stock Keeping Unit)
                </label>
                <button
                  type="button"
                  onClick={generateRandomSKU}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-generate SKU</span>
                </button>
              </div>
              <Input
                placeholder="AUD-001"
                {...register('sku')}
                error={errors.sku?.message}
              />
              <p className="text-[11px] text-slate-400">
                Must be globally unique. Used for barcode scanning and warehouse logistics.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Description & Specifications
              </label>
              <textarea
                rows={4}
                placeholder="Provide detailed features, package contents, warranty details, and specifications..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="text-xs text-rose-400">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <Input
                  label="Selling Price (BDT ৳)"
                  type="number"
                  step="0.01"
                  placeholder="38500"
                  {...register('price')}
                  error={errors.price?.message}
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <Input
                  label="Initial Stock Quantity"
                  type="number"
                  placeholder="10"
                  {...register('stock_quantity')}
                  error={errors.stock_quantity?.message}
                  disabled={isEdit}
                />
                {isEdit && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    For existing products, stock adjustments should be done via the Inventory module to maintain audit trails.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls (1 Column) */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Visibility Status
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Catalog Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="active">Active (Visible in Storefront)</option>
                <option value="inactive">Inactive (Hidden from Customers)</option>
                <option value="archived">Archived (Discontinued)</option>
              </select>
              {errors.status?.message && (
                <p className="text-xs text-rose-400">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Media / Image Upload Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Product Image
            </h3>

            {/* Preview Box */}
            <div className="relative aspect-square rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-900/90 text-white backdrop-blur-sm transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">No image uploaded</p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</p>
                </div>
              )}
            </div>

            {/* File Upload Trigger */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="product-image-upload"
              />
              <label
                htmlFor="product-image-upload"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{previewUrl ? 'Replace Image File' : 'Upload Image File'}</span>
              </label>

              {/* Or Direct Image URL */}
              <div className="pt-2">
                <Input
                  label="Or External Image URL"
                  placeholder="https://images.unsplash.com/..."
                  {...register('image')}
                  onChange={(e) => {
                    setValue('image', e.target.value);
                    if (!selectedFile) {
                      setPreviewUrl(e.target.value || null);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
