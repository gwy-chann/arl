'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import type { CategoryWithProductCount } from '@/specs/005-product-category-management/contracts/category-contracts';
import { validateCategoryName } from '@/lib/categories/category-service';

interface CategoryModalProps {
  isOpen: boolean;
  mode: 'add' | 'rename';
  category?: CategoryWithProductCount | null;
  onClose: () => void;
  onSave: (name: string, id?: string) => Promise<void>;
}

function CategoryModalForm({
  mode,
  category,
  onClose,
  onSave,
}: Readonly<{
  mode: 'add' | 'rename';
  category?: CategoryWithProductCount | null;
  onClose: () => void;
  onSave: (name: string, id?: string) => Promise<void>;
}>) {
  const [name, setName] = useState(mode === 'rename' && category ? category.name : '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCategoryName(name);
    if (!validation.valid) {
      setError(validation.error || 'Invalid category name');
      inputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(validation.name, category?.id);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save category';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="cnm"
            className="text-[13px] font-semibold text-text-muted uppercase tracking-wider"
          >
            Category name
          </label>
          <input
            ref={inputRef}
            id="cnm"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Soy Sauce"
            required
            disabled={isSubmitting}
            className={`w-full bg-bg-input border ${
              error ? 'border-danger focus:border-danger' : 'border-border focus:border-border-focus'
            } text-text-primary rounded-[var(--r)] px-3.5 py-2 text-[15px] outline-none transition-colors duration-150`}
          />
          {error && (
            <p className="text-[13px] text-danger font-medium m-0 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-border mt-5">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 py-2 text-[14px] font-medium text-text-primary bg-secondary hover:bg-secondary-hover border border-border rounded-[var(--r)] cursor-pointer transition-colors duration-150"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 py-2 text-[14px] font-semibold text-text-light bg-primary hover:bg-primary-hover border-0 rounded-[var(--r)] cursor-pointer transition-colors duration-150 shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save category'}
        </button>
      </div>
    </form>
  );
}

export function CategoryModal({
  isOpen,
  mode,
  category,
  onClose,
  onSave,
}: Readonly<CategoryModalProps>) {
  const title = mode === 'rename' ? 'Rename category' : 'Add category';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
    >
      {isOpen && (
        <CategoryModalForm
          key={`${mode}-${category?.id ?? 'new'}`}
          mode={mode}
          category={category}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}
