'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { saveStockMinimumsAction } from '@/lib/settings/settings-actions';
import type { StockMatrixProductDTO } from '@/lib/settings/settings-contracts';

const SIZES: Array<{ key: '350' | '1L' | 'gal'; label: string }> = [
  { key: '350', label: '350ml' },
  { key: '1L', label: '1L' },
  { key: 'gal', label: '1 Gallon' },
];

interface StockMinimumsFormProps {
  initialMatrix: StockMatrixProductDTO[];
}

export function StockMinimumsForm({ initialMatrix }: Readonly<StockMinimumsFormProps>) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Initialize input state map: { [variantId]: minStockLevel }
  const [values, setValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const prod of initialMatrix) {
      for (const size of SIZES) {
        const v = prod.variants[size.key];
        if (v?.variant_id) {
          map[v.variant_id] = v.min_stock_level;
        }
      }
    }
    return map;
  });

  const handleInputChange = (variantId: string, value: string) => {
    const parsed = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setValues((prev) => ({
      ...prev,
      [variantId]: parsed,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const items = Object.entries(values).map(([variant_id, min_stock_level]) => ({
      variant_id,
      min_stock_level,
    }));

    startTransition(async () => {
      const res = await saveStockMinimumsAction({ items });

      if (!res.success) {
        showToast(res.error || 'Failed to save minimum levels', undefined, 'danger');
        return;
      }

      showToast('Minimum stock levels saved');
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-bg-surface border border-border rounded-xl shadow-xs overflow-hidden"
    >
      <div className="p-5 md:p-6">
        <p className="text-sm text-text-muted mb-4">
          A variant is flagged as low when stock reaches this number.
        </p>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-bg-muted border-b border-border text-text-muted font-semibold">
                <th className="py-2.5 px-4">Product</th>
                {SIZES.map((s) => (
                  <th key={s.key} className="py-2.5 px-4 text-center">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialMatrix.map((prod) => (
                <tr key={prod.product_id} className="hover:bg-bg-hover/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-text-primary">
                    {prod.product_name}
                  </td>
                  {SIZES.map((s) => {
                    const variant = prod.variants[s.key];
                    const variantId = variant?.variant_id || '';
                    const currentValue = variantId in values ? values[variantId] : variant?.min_stock_level ?? 0;

                    return (
                      <td key={s.key} className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          value={currentValue}
                          onChange={(e) => handleInputChange(variantId, e.target.value)}
                          aria-label={`${prod.product_name} ${s.label} minimum`}
                          className="w-24 text-center bg-bg-input border border-border focus:border-border-focus text-text-primary px-2.5 py-1.5 rounded-md text-sm outline-hidden transition-colors"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Footer */}
      <div className="bg-bg-muted border-t border-border px-5 py-3.5 flex justify-end gap-2.5">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary-hover text-text-light font-semibold px-4 py-2 text-sm rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save minimum levels'}
        </button>
      </div>
    </form>
  );
}
