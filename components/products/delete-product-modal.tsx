'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import type { ProductWithVariants } from '@/specs/006-multi-variant-product-catalog/contracts/product-contracts';

interface DeleteProductModalProps {
  isOpen: boolean;
  product: ProductWithVariants | null;
  categoryProductCount?: number;
  onClose: () => void;
  onDeleteProductOnly: (product: ProductWithVariants) => Promise<void>;
  onDeleteCategoryOnly: (categoryName: string, categoryId?: string | null) => Promise<void>;
  onDeleteBoth: (product: ProductWithVariants) => Promise<void>;
}

export function DeleteProductModal({
  isOpen,
  product,
  categoryProductCount = 1,
  onClose,
  onDeleteProductOnly,
  onDeleteCategoryOnly,
  onDeleteBoth,
}: Readonly<DeleteProductModalProps>) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!product) return null;

  const hasCategory = Boolean(product.category_name || product.category_id);
  const categoryName = product.category_name || 'Uncategorized';

  const handleProductOnly = async () => {
    try {
      setLoadingAction('product-only');
      await onDeleteProductOnly(product);
      onClose();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCategoryOnly = async () => {
    try {
      setLoadingAction('category-only');
      await onDeleteCategoryOnly(categoryName, product.category_id);
      onClose();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBoth = async () => {
    try {
      setLoadingAction('both');
      await onDeleteBoth(product);
      onClose();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${product.name}?`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        {!hasCategory ? (
          // Product without a category
          <div className="flex flex-col gap-4">
            <p className="text-[14px] text-text-muted m-0 leading-relaxed">
              This removes <strong className="text-text-primary font-semibold">{product.name}</strong> and all of its packaging sizes from the catalog. Past sales records will stay intact.
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={Boolean(loadingAction)}
                className="px-4 py-2 rounded-(--r) bg-secondary hover:bg-secondary-hover text-text-primary border border-border text-[13.5px] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProductOnly}
                disabled={Boolean(loadingAction)}
                className="px-4 py-2 rounded-(--r) bg-danger hover:bg-danger-hover text-text-light text-[13.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingAction === 'product-only' ? 'Deleting...' : 'Delete product'}
              </button>
            </div>
          </div>
        ) : (
          // Product WITH a category: 3 deletion options
          <div className="flex flex-col gap-4">
            <p className="text-[13.5px] text-text-muted m-0 leading-relaxed">
              <strong className="text-text-primary font-semibold">{product.name}</strong> is in category{' '}
              <span className="font-semibold text-text-primary">
                &ldquo;{categoryName}&rdquo;
              </span>
              {categoryProductCount > 1 && (
                <span> ({categoryProductCount} products in this category)</span>
              )}. Please choose what you want to delete:
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Option 1: Delete product only */}
              <button
                type="button"
                onClick={handleProductOnly}
                disabled={Boolean(loadingAction)}
                className="w-full text-left p-3.5 rounded-(--r) border border-border bg-bg-surface hover:bg-bg-hover hover:border-border-focus transition-all cursor-pointer group disabled:opacity-50"
                data-testid="delete-product-only-btn"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">
                      Delete product only
                    </div>
                    <p className="text-[12.5px] text-text-muted m-0 mt-0.5">
                      Removes only <strong className="text-text-secondary">{product.name}</strong>. The category &ldquo;{categoryName}&rdquo; remains in the system.
                    </p>
                  </div>
                  <span className="shrink-0 text-text-muted group-hover:text-primary font-bold text-[16px]">
                    &rarr;
                  </span>
                </div>
              </button>

              {/* Option 2: Delete category only */}
              <button
                type="button"
                onClick={handleCategoryOnly}
                disabled={Boolean(loadingAction)}
                className="w-full text-left p-3.5 rounded-(--r) border border-border bg-bg-surface hover:bg-bg-hover hover:border-border-focus transition-all cursor-pointer group disabled:opacity-50"
                data-testid="delete-category-only-btn"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary group-hover:text-accent transition-colors">
                      Delete category only
                    </div>
                    <p className="text-[12.5px] text-text-muted m-0 mt-0.5">
                      Deletes category &ldquo;{categoryName}&rdquo;. <strong className="text-text-secondary">{product.name}</strong> and any linked products become uncategorized.
                    </p>
                  </div>
                  <span className="shrink-0 text-text-muted group-hover:text-accent font-bold text-[16px]">
                    &rarr;
                  </span>
                </div>
              </button>

              {/* Option 3: Delete both product and category */}
              <button
                type="button"
                onClick={handleBoth}
                disabled={Boolean(loadingAction)}
                className="w-full text-left p-3.5 rounded-(--r) border border-danger-border/40 bg-danger-light/30 hover:bg-danger-light hover:border-danger-border transition-all cursor-pointer group disabled:opacity-50"
                data-testid="delete-both-btn"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[14px] font-semibold text-danger">
                      Delete both product and category
                    </div>
                    <p className="text-[12.5px] text-danger/80 m-0 mt-0.5">
                      Removes <strong className="font-semibold">{product.name}</strong> and permanently deletes the category &ldquo;{categoryName}&rdquo;.
                    </p>
                  </div>
                  <span className="shrink-0 text-danger font-bold text-[16px]">
                    &times;
                  </span>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-border mt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={Boolean(loadingAction)}
                className="px-4 py-2 rounded-(--r) bg-secondary hover:bg-secondary-hover text-text-primary border border-border text-[13.5px] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
