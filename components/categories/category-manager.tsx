'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import type { CategoryWithProductCount } from '@/specs/005-product-category-management/contracts/category-contracts';
import { getDeleteCategoryPrompt } from '@/specs/005-product-category-management/contracts/category-contracts';
import { CategoryModal } from './category-modal';
import { useConfirm } from '@/components/ui/confirm-provider';
import { useToast } from '@/components/ui/toast-provider';
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
} from '@/lib/categories/category-actions';

interface CategoryManagerProps {
  initialCategories: CategoryWithProductCount[];
}

export function CategoryManager({ initialCategories }: Readonly<CategoryManagerProps>) {
  const [categories, setCategories] = useState<CategoryWithProductCount[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'rename';
    category?: CategoryWithProductCount | null;
  }>({
    isOpen: false,
    mode: 'add',
    category: null,
  });

  const confirm = useConfirm();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  // Filter categories in real time based on search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const handleOpenAdd = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      category: null,
    });
  };

  const handleOpenRename = (category: CategoryWithProductCount) => {
    setModalState({
      isOpen: true,
      mode: 'rename',
      category,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveCategory = async (name: string, id?: string) => {
    if (modalState.mode === 'add') {
      const result = await createCategoryAction(name);
      if (!result.success || !result.category) {
        throw new Error(result.error || 'Failed to save category');
      }

      startTransition(() => {
        setCategories((prev) => [...prev, result.category!]);
      });
      showToast('Category saved');
    } else if (modalState.mode === 'rename' && id) {
      const result = await renameCategoryAction(id, name);
      if (!result.success || !result.category) {
        throw new Error(result.error || 'Failed to rename category');
      }

      startTransition(() => {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: result.category!.name } : c))
        );
      });
      showToast('Category saved');
    }
  };

  const handleDeleteCategory = async (category: CategoryWithProductCount) => {
    const prompt = getDeleteCategoryPrompt(category.name, category.product_count);
    const confirmed = await confirm({
      title: prompt.title,
      message: prompt.message,
      confirmLabel: prompt.confirmLabel,
      variant: prompt.variant,
    });

    if (!confirmed) {
      return;
    }

    const result = await deleteCategoryAction(category.id);
    if (!result.success) {
      showToast(result.error || 'Failed to delete category', undefined, 'danger');
      return;
    }

    startTransition(() => {
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    });
    showToast('Category deleted');
  };

  return (
    <div className="max-w-4xl">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-text-muted mb-3">
        <Link
          href="/products"
          className="hover:text-text-primary transition-colors duration-150"
        >
          Products
        </Link>
        <span className="opacity-40 select-none">/</span>
        <span className="text-text-secondary font-medium">Categories</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
            Categories
          </h1>
          <p className="text-[14.5px] text-text-muted mt-1 m-0">
            Group products so they are easier to find.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-light font-semibold text-[14px] px-4 py-2 rounded-(--r) shadow-sm cursor-pointer transition-colors duration-150"
            data-testid="add-category-btn"
          >
            <svg
              className="w-4 h-4 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add category
          </button>
        </div>
      </div>

      {/* Table Card (max-w-[640px] matching mockup) */}
      <div className="bg-bg-surface border border-border rounded-(--r) overflow-hidden shadow-sm max-w-160">
        {/* Toolbar */}
        <div className="p-3.5 border-b border-border bg-bg-surface flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <svg
                className="w-4 h-4 stroke-current"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              id="category-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories"
              className="w-full bg-bg-base border border-border text-text-primary placeholder:text-text-muted text-[14px] rounded-(--r) pl-9 pr-3.5 py-1.5 outline-none focus:border-border-focus transition-colors duration-150"
              data-testid="category-search-input"
            />
          </div>
        </div>

        {/* Table Wrap */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[14.5px]" id="ctbl">
            <thead>
              <tr className="bg-bg-muted border-b border-border">
                <th scope="col" className="py-2.5 px-4 font-semibold text-[12px] uppercase tracking-wider text-text-muted">
                  Category
                </th>
                <th
                  scope="col"
                  className="py-2.5 px-4 font-semibold text-[12px] uppercase tracking-wider text-text-muted text-right w-28"
                >
                  Products
                </th>
                <th scope="col" className="py-2.5 px-4 text-right w-44">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 px-4 text-center text-text-muted">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr
                    key={c.id}
                    data-s={c.name}
                    className="hover:bg-bg-hover transition-colors duration-100"
                  >
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-text-secondary tabular-nums">
                      {c.product_count}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenRename(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[12.5px] font-semibold text-text-primary bg-secondary hover:bg-secondary-hover border border-border rounded-sm cursor-pointer transition-colors duration-150"
                          data-testid={`rename-btn-${c.id}`}
                        >
                          <svg
                            className="w-3.5 h-3.5 stroke-current"
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[12.5px] font-semibold text-text-light bg-danger hover:bg-danger/90 border-0 rounded-sm cursor-pointer transition-colors duration-150"
                          data-testid={`delete-btn-${c.id}`}
                        >
                          <svg
                            className="w-3.5 h-3.5 stroke-current"
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Rename Category Modal */}
      <CategoryModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        category={modalState.category}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

