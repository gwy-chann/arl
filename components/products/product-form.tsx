'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PRODUCT_SIZES,
  productInputSchema,
  type ProductSizeKey,
  type ProductWithVariants,
} from '@/specs/006-multi-variant-product-catalog/contracts/product-contracts';
import { useToast } from '@/components/ui/toast-provider';
import {
  createProductAction,
  updateProductAction,
} from '@/lib/products/product-actions';

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialProduct?: ProductWithVariants | null;
  categories: CategoryOption[];
}

interface VariantRowState {
  size: ProductSizeKey;
  cost_price: string;
  selling_price: string;
  min_stock_level: string;
  opening_stock: string;
}

export function ProductForm({
  initialProduct = null,
  categories,
}: Readonly<ProductFormProps>) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || '');
  const [categoryId, setCategoryId] = useState<string>(
    initialProduct?.category_id || (categories[0]?.id ?? '')
  );

  const [variants, setVariants] = useState<VariantRowState[]>(() => {
    return PRODUCT_SIZES.map((sz) => {
      const existing = initialProduct?.variants.find((v) => v.size === sz.key);
      return {
        size: sz.key,
        cost_price: existing ? String(existing.cost_price) : '',
        selling_price: existing ? String(existing.selling_price) : '',
        min_stock_level: existing ? String(existing.min_stock_level) : '',
        opening_stock: '0',
      };
    });
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateVariantField = (
    sizeKey: ProductSizeKey,
    field: keyof VariantRowState,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.size === sizeKey ? { ...v, [field]: value } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Prepare payload and validate via Zod schema
      const payloadVariants = variants.map((v) => ({
        size: v.size,
        cost_price: parseFloat(v.cost_price || '0'),
        selling_price: parseFloat(v.selling_price || '0'),
        min_stock_level: parseInt(v.min_stock_level || '0', 10),
        opening_stock: parseInt(v.opening_stock || '0', 10),
      }));

      const validationResult = productInputSchema.safeParse({
        name,
        category_id: categoryId || null,
        variants: payloadVariants,
      });

      if (!validationResult.success) {
        const issues =
          validationResult.error.issues ||
          (validationResult.error as unknown as { errors?: Array<{ message: string }> }).errors ||
          [];
        const firstIssue = issues[0]?.message || 'Please check form inputs';
        setError(firstIssue);
        setIsSubmitting(false);
        return;
      }

      if (isEdit && initialProduct) {
        const res = await updateProductAction({
          id: initialProduct.id,
          name: validationResult.data.name,
          category_id: validationResult.data.category_id,
          variants: payloadVariants,
        });

        if (!res.success) {
          setError(res.error || 'Failed to update product');
          setIsSubmitting(false);
          return;
        }

        showToast('Product saved');
      } else {
        const res = await createProductAction({
          name: validationResult.data.name,
          category_id: validationResult.data.category_id,
          variants: payloadVariants,
        });

        if (!res.success) {
          setError(res.error || 'Failed to create product');
          setIsSubmitting(false);
          return;
        }

        showToast('Product added');
      }

      router.push('/products');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-text-muted mb-3">
        <Link
          href="/products"
          className="hover:text-text-primary transition-colors duration-150"
        >
          Products
        </Link>
        <span className="opacity-40 select-none">/</span>
        <span className="text-text-secondary font-medium">
          {isEdit ? 'Edit' : 'Add'}
        </span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          {isEdit ? `Edit ${initialProduct?.name}` : 'Add product'}
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          {isEdit
            ? 'Update prices and minimum stock for each size.'
            : 'Set the product and the price of each size.'}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-5 p-3.5 rounded-[var(--r)] bg-danger/10 border border-danger-border/30 text-danger text-[14px] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-danger hover:text-danger/80 text-[16px] leading-none ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden"
      >
        {/* Basic Details Section */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pn"
              className="text-[13.5px] font-semibold text-text-primary"
            >
              Product name
            </label>
            <input
              id="pn"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Toyo"
              className="w-full bg-bg-base border border-border rounded-[var(--r)] px-3 py-2 text-[14.5px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pc"
              className="text-[13.5px] font-semibold text-text-primary"
            >
              Category
            </label>
            <select
              id="pc"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-[var(--r)] px-3 py-2 text-[14.5px] text-text-primary focus:outline-none focus:border-border-focus transition-colors"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Size Variants Pricing Section */}
        <div className="p-5">
          <h2 className="text-[15px] font-bold text-text-primary m-0">
            Size variants
          </h2>
          <p className="text-[13.5px] text-text-muted mt-0.5 mb-4">
            Cost and selling price are used to work out profit on every sale.
          </p>

          <div className="overflow-x-auto border border-border rounded-[var(--r)]">
            <table className="w-full text-left border-collapse" id="var-table">
              <thead>
                <tr className="border-b border-border bg-bg-base/60 text-[12.5px] uppercase tracking-wider font-semibold text-text-muted">
                  <th scope="col" className="px-3.5 py-2.5">
                    Size
                  </th>
                  <th scope="col" className="px-3.5 py-2.5">
                    Cost price (₱)
                  </th>
                  <th scope="col" className="px-3.5 py-2.5">
                    Selling price (₱)
                  </th>
                  <th scope="col" className="px-3.5 py-2.5">
                    Minimum stock
                  </th>
                  {!isEdit && (
                    <th scope="col" className="px-3.5 py-2.5">
                      Opening stock
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {PRODUCT_SIZES.map((sz, idx) => {
                  const v = variants[idx];
                  return (
                    <tr key={sz.key} className="hover:bg-bg-hover/30 transition-colors">
                      <td className="px-3.5 py-3 font-semibold text-text-primary text-[14px]">
                        {sz.label}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          id={`cost-${sz.key}`}
                          value={v.cost_price}
                          onChange={(e) =>
                            updateVariantField(sz.key, 'cost_price', e.target.value)
                          }
                          required
                          aria-label={`${sz.label} cost price`}
                          className="w-full max-w-[120px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                        />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          id={`price-${sz.key}`}
                          value={v.selling_price}
                          onChange={(e) =>
                            updateVariantField(sz.key, 'selling_price', e.target.value)
                          }
                          required
                          aria-label={`${sz.label} selling price`}
                          className="w-full max-w-[120px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                        />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          id={`min-${sz.key}`}
                          value={v.min_stock_level}
                          onChange={(e) =>
                            updateVariantField(sz.key, 'min_stock_level', e.target.value)
                          }
                          required
                          aria-label={`${sz.label} minimum stock`}
                          className="w-full max-w-[100px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                        />
                      </td>
                      {!isEdit && (
                        <td className="px-3.5 py-2.5">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            id={`open-${sz.key}`}
                            value={v.opening_stock}
                            onChange={(e) =>
                              updateVariantField(sz.key, 'opening_stock', e.target.value)
                            }
                            aria-label={`${sz.label} opening stock`}
                            className="w-full max-w-[100px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Footer Actions */}
        <div className="p-4 bg-bg-base border-t border-border flex items-center justify-end gap-2.5">
          <Link
            href="/products"
            className="px-4 py-2 rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border text-[14px] font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[var(--r)] bg-primary hover:bg-primary-hover disabled:opacity-50 text-text-light text-[14px] font-medium shadow-xs transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : 'Save product'}
          </button>
        </div>
      </form>
    </div>
  );
}
