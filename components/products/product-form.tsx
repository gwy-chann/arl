'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PRODUCT_SIZES,
  productInputSchema,
  getSizeLabel,
  type ProductWithVariants,
} from '@/specs/006-multi-variant-product-catalog/contracts/product-contracts';
import { useToast } from '@/components/ui/toast-provider';
import {
  createProductAction,
  updateProductAction,
} from '@/lib/products/product-actions';
import { createCategoryAction } from '@/lib/categories/category-actions';
import { notifyProductsUpdated } from '@/lib/products/product-events';

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  initialProduct?: ProductWithVariants | null;
  categories: CategoryOption[];
}

interface VariantRowState {
  id?: string;
  size: string;
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
  const [categoriesList, setCategoriesList] = useState<CategoryOption[]>(categories);
  const [categoryId, setCategoryId] = useState<string>(
    initialProduct ? (initialProduct.category_id ?? '') : (categories[0]?.id ?? '')
  );

  // Initialize variants: existing variants for edit mode, or standard presets for new mode
  const [variants, setVariants] = useState<VariantRowState[]>(() => {
    if (initialProduct?.variants && initialProduct.variants.length > 0) {
      return initialProduct.variants.map((v) => ({
        id: v.id,
        size: getSizeLabel(v.size),
        cost_price: String(v.cost_price),
        selling_price: String(v.selling_price),
        min_stock_level: String(v.min_stock_level),
        opening_stock: String(v.stock_quantity),
      }));
    }
    return PRODUCT_SIZES.map((sz) => ({
      size: sz.label,
      cost_price: '',
      selling_price: '',
      min_stock_level: '',
      opening_stock: '0',
    }));
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCategoryModalOpen) {
        setIsCategoryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCategoryModalOpen]);

  const updateVariantField = (
    index: number,
    field: keyof VariantRowState,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: '',
        cost_price: '',
        selling_price: '',
        min_stock_level: '',
        opening_stock: '0',
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCategoryModal = () => {
    setNewCategoryName('');
    setCategoryModalError(null);
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryModalError('Category name is required');
      return;
    }

    setCategoryModalError(null);
    setIsCreatingCategory(true);

    try {
      const res = await createCategoryAction(trimmed);
      if (!res.success || !res.category) {
        setCategoryModalError(res.error || 'Failed to create category');
        setIsCreatingCategory(false);
        return;
      }

      // Append new category to state and pre-select it
      const newCat: CategoryOption = {
        id: res.category.id,
        name: res.category.name,
      };

      setCategoriesList((prev) => {
        const exists = prev.some((c) => c.id === newCat.id);
        return exists ? prev : [...prev, newCat];
      });
      setCategoryId(newCat.id);
      setIsCategoryModalOpen(false);
      showToast('Category added');
    } catch (err: unknown) {
      setCategoryModalError(
        err instanceof Error ? err.message : 'Failed to create category'
      );
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // In Add mode, filter out completely unconfigured/empty starter rows
      const submittedRows = variants.filter((v) => {
        if (isEdit && Boolean(v.id)) return true;
        const hasCost = Boolean(v.cost_price && v.cost_price.trim());
        const hasPrice = Boolean(v.selling_price && v.selling_price.trim());
        const hasSize = Boolean(
          v.size &&
            v.size.trim() &&
            !v.size.trim().toLowerCase().startsWith('e.g.')
        );
        return hasSize || hasCost || hasPrice;
      });

      if (submittedRows.length === 0) {
        setError('At least one size variant is required');
        setIsSubmitting(false);
        return;
      }

      // Check empty sizes among submitted rows
      const emptySizeIndex = submittedRows.findIndex(
        (v) =>
          !v.size.trim() || v.size.trim().toLowerCase().startsWith('e.g.')
      );
      if (emptySizeIndex !== -1) {
        setError('All configured variants must have a valid packaging size label');
        setIsSubmitting(false);
        return;
      }

      // Prepare payload and validate via Zod schema
      const payloadVariants = submittedRows.map((v) => ({
        id: v.id,
        size: v.size.trim(),
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

        showToast(res.product?.name ? `Saved ${res.product.name}` : 'Product added');
      }

      notifyProductsUpdated();
      router.push('/products');
      router.refresh();
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
            ? 'Update prices, minimum stock, and packaging variants.'
            : 'Set the product, category, and pricing for each size variant.'}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-5 p-3.5 rounded-[var(--r)] bg-danger/10 border border-danger-border/30 text-danger text-[14px] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-danger hover:text-danger/80 text-[16px] leading-none ml-2 cursor-pointer"
            aria-label="Dismiss error"
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="pc"
                className="text-[13.5px] font-semibold text-text-primary"
              >
                Category
              </label>
              <button
                type="button"
                onClick={handleOpenCategoryModal}
                className="text-[12.5px] font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer"
              >
                + Add new category
              </button>
            </div>
            <select
              id="pc"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-[var(--r)] px-3 py-2 text-[14.5px] text-text-primary focus:outline-none focus:border-border-focus transition-colors"
            >
              <option value="">Uncategorized</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Size Variants Pricing Section */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-bold text-text-primary m-0">
              Size variants
            </h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="px-3 py-1.5 text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary-border/40 rounded-[var(--r)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              + Add size variant
            </button>
          </div>
          <p className="text-[13.5px] text-text-muted mt-0.5 mb-4">
            Cost and selling price are used to calculate profit margins on every sale.
          </p>

          {/* Datalist for standard packaging suggestions */}
          <datalist id="size-preset-suggestions">
            <option value="350 ml" />
            <option value="1 L" />
            <option value="1 gal" />
            <option value="500 ml" />
            <option value="20 L Drum" />
            <option value="Sachet 100ml" />
          </datalist>

          <div className="overflow-x-auto border border-border rounded-[var(--r)]">
            <table className="w-full text-left border-collapse" id="var-table">
              <thead>
                <tr className="border-b border-border bg-bg-base/60 text-[12.5px] uppercase tracking-wider font-semibold text-text-muted">
                  <th scope="col" className="px-3.5 py-2.5 min-w-[150px]">
                    Packaging size
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
                  <th scope="col" className="px-3.5 py-2.5">
                    Opening stock
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 text-right w-[60px]">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {variants.map((v, idx) => (
                  <tr
                    key={v.id || `variant-row-${idx}`}
                    className="hover:bg-bg-hover/30 transition-colors"
                  >
                    <td className="px-3.5 py-2.5">
                      <input
                        type="text"
                        list="size-preset-suggestions"
                        value={v.size}
                        onChange={(e) =>
                          updateVariantField(idx, 'size', e.target.value)
                        }
                        placeholder="e.g. 1 L or 500 ml"
                        aria-label={`Variant ${idx + 1} packaging size`}
                        className="w-full bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                      />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.cost_price}
                        onChange={(e) =>
                          updateVariantField(idx, 'cost_price', e.target.value)
                        }
                        placeholder="0.00"
                        aria-label={`${v.size || 'Variant'} cost price`}
                        className="w-full max-w-[120px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                      />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.selling_price}
                        onChange={(e) =>
                          updateVariantField(idx, 'selling_price', e.target.value)
                        }
                        placeholder="0.00"
                        aria-label={`${v.size || 'Variant'} selling price`}
                        className="w-full max-w-[120px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                      />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={v.min_stock_level}
                        onChange={(e) =>
                          updateVariantField(idx, 'min_stock_level', e.target.value)
                        }
                        placeholder="0"
                        aria-label={`${v.size || 'Variant'} minimum stock`}
                        className="w-full max-w-[100px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                      />
                    </td>
                    <td className="px-3.5 py-2.5">
                      {isEdit && Boolean(v.id) ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[13.5px] font-mono text-text-muted px-2.5 py-1.5 bg-bg-base/70 rounded-[var(--r)] border border-border/50 block min-w-[70px] text-center select-none"
                            title="Current stock quantity (managed via sales & movements)"
                          >
                            {v.opening_stock || '0'}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={v.opening_stock}
                          onChange={(e) =>
                            updateVariantField(idx, 'opening_stock', e.target.value)
                          }
                          placeholder="0"
                          aria-label={`${v.size || 'Variant'} opening stock`}
                          className="w-full max-w-[100px] bg-bg-base border border-border rounded-[var(--r)] px-2.5 py-1.5 text-[14px] text-text-primary focus:outline-none focus:border-border-focus"
                        />
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-text-muted hover:text-danger text-[16px] transition-colors p-1 leading-none cursor-pointer"
                          aria-label={`Remove ${v.size || 'variant'}`}
                          title="Remove variant"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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

      {/* Accessible Inline Category Creation Modal */}
      {isCategoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inline-cat-title"
          className="fixed inset-0 z-50 bg-[#141613]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-bg-surface border border-border rounded-[var(--r)] shadow-lg max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="inline-cat-title"
                className="text-[18px] font-bold text-text-primary m-0"
              >
                Add new category
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-[18px] leading-none cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="text-[14px] text-text-muted mt-0 mb-4">
              Create a new category for products without leaving this form.
            </p>

            {categoryModalError && (
              <div className="mb-4 p-3 rounded-[var(--r)] bg-danger/10 border border-danger-border/30 text-danger text-[13.5px]">
                {categoryModalError}
              </div>
            )}

            <form onSubmit={handleCreateCategory}>
              <div className="flex flex-col gap-1.5 mb-5">
                <label
                  htmlFor="new-category-name"
                  className="text-[13.5px] font-semibold text-text-primary"
                >
                  Category name
                </label>
                <input
                  id="new-category-name"
                  type="text"
                  autoFocus
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Cooking Oil"
                  className="w-full bg-bg-base border border-border rounded-[var(--r)] px-3 py-2 text-[14.5px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border text-[14px] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  className="px-4 py-2 rounded-[var(--r)] bg-primary hover:bg-primary-hover disabled:opacity-50 text-text-light text-[14px] font-medium shadow-xs transition-colors cursor-pointer"
                >
                  {isCreatingCategory ? 'Saving...' : 'Save category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
