'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CustomerDTO } from '@/lib/customers/customer-contracts';
import {
  createCustomerAction,
  updateCustomerAction,
} from '@/lib/customers/customer-actions';
import { useToast } from '@/components/ui/toast-provider';

interface CustomerFormProps {
  initialCustomer?: CustomerDTO | null;
  mode?: 'create' | 'edit';
}

export function CustomerForm({
  initialCustomer,
  mode = 'create',
}: Readonly<CustomerFormProps>) {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState(initialCustomer?.name || '');
  const [phone, setPhone] = useState(initialCustomer?.phone || '');
  const [address, setAddress] = useState(initialCustomer?.address || '');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };

      const result =
        mode === 'edit' && initialCustomer
          ? await updateCustomerAction(initialCustomer.id, payload)
          : await createCustomerAction(payload);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setGeneralError(result.error || 'Failed to save customer');
        setIsSubmitting(false);
        return;
      }

      showToast('Customer saved');
      const targetId = result.customerId || initialCustomer?.id;
      if (targetId) {
        router.push(`/customers/${targetId}`);
      } else {
        router.push('/customers');
      }
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const isEdit = mode === 'edit';
  const cancelHref = isEdit && initialCustomer ? `/customers/${initialCustomer.id}` : '/customers';

  return (
    <div className="w-full max-w-2xl">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-[13.5px] text-text-muted">
          <li>
            <Link href="/customers" className="hover:text-primary transition-colors">
              Customers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-text-primary" aria-current="page">
            {isEdit ? 'Edit' : 'Add'}
          </li>
        </ol>
      </nav>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          {isEdit ? 'Edit customer' : 'Add customer'}
        </h1>
      </div>

      {generalError && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-danger-light border border-danger-border text-danger rounded-[var(--r)] text-[14px]"
        >
          {generalError}
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden"
      >
        <div className="p-5 sm:p-6 space-y-4">
          {/* Customer Name */}
          <div>
            <label
              htmlFor="cn"
              className="block text-[13.5px] font-semibold text-text-primary mb-1.5"
            >
              Customer or business name <span className="text-danger">*</span>
            </label>
            <input
              id="cn"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aling Nena's Sari-Sari Store"
              className={`w-full px-3.5 py-2 text-[14.5px] bg-bg-input text-text-primary border ${
                fieldErrors.name ? 'border-danger' : 'border-border'
              } rounded-[var(--r)] focus:outline-hidden focus:border-border-focus transition-colors`}
            />
            {fieldErrors.name && (
              <p className="text-[12.5px] text-danger mt-1">
                {fieldErrors.name.join(', ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label
                htmlFor="cp"
                className="block text-[13.5px] font-semibold text-text-primary mb-1.5"
              >
                Mobile number <span className="text-danger">*</span>
              </label>
              <input
                id="cp"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XX XXX XXXX"
                className={`w-full px-3.5 py-2 text-[14.5px] bg-bg-input text-text-primary border ${
                  fieldErrors.phone ? 'border-danger' : 'border-border'
                } rounded-[var(--r)] focus:outline-hidden focus:border-border-focus transition-colors`}
              />
              {fieldErrors.phone && (
                <p className="text-[12.5px] text-danger mt-1">
                  {fieldErrors.phone.join(', ')}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="ca"
                className="block text-[13.5px] font-semibold text-text-primary mb-1.5"
              >
                Address
              </label>
              <input
                id="ca"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Purok 3, Brgy. San Roque"
                className="w-full px-3.5 py-2 text-[14.5px] bg-bg-input text-text-primary border border-border rounded-[var(--r)] focus:outline-hidden focus:border-border-focus transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="px-5 py-3.5 sm:px-6 bg-bg-muted border-t border-border flex items-center justify-end gap-3">
          <Link
            href={cancelHref}
            className="px-4 py-2 text-[14px] font-medium text-text-primary bg-secondary hover:bg-secondary-hover border border-border rounded-[var(--r)] transition-colors shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-[14px] font-medium text-text-light bg-primary hover:bg-primary-hover disabled:opacity-60 rounded-[var(--r)] transition-colors shadow-xs"
          >
            {isSubmitting ? 'Saving...' : 'Save customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
