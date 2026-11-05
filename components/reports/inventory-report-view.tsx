'use client';

import { useState, useMemo } from 'react';
import { ReportToolbar } from './report-toolbar';
import {
  aggregateInventoryReport,
  type ProductReference,
  type VariantReference,
} from '@/lib/reports/report-service';
import { downloadCsvFile } from '@/lib/reports/csv-export';
import { formatPeso } from '@/lib/customers/customer-service';

export interface InventoryReportViewProps {
  products: ProductReference[];
  variants: VariantReference[];
}

export function InventoryReportView({ products, variants }: InventoryReportViewProps) {
  const [productId, setProductId] = useState<string>('all');
  const [size, setSize] = useState<string>('all');

  const summary = useMemo(() => {
    return aggregateInventoryReport(variants, products, { productId, size });
  }, [variants, products, productId, size]);

  const handleExportCsv = () => {
    const rows = summary.rows.map((r) => [
      r.productName,
      r.sizeLabel,
      r.inStock,
      r.minStock,
      r.valueAtCost,
      r.valueAtSellingPrice,
      r.status,
    ]);

    const footer = [
      'Total',
      '',
      summary.totalUnitsInStock,
      '',
      summary.totalValueAtCost,
      summary.totalValueAtSellingPrice,
      '',
    ];

    downloadCsvFile({
      filename: `arlq-inventory-valuation-report`,
      headers: [
        'Product',
        'Size',
        'In Stock',
        'Minimum',
        'Value at Cost',
        'Value at Selling Price',
        'Status',
      ],
      rows,
      footer,
    });
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
      <ReportToolbar
        productId={productId}
        products={products}
        onProductChange={setProductId}
        size={size}
        onSizeChange={setSize}
        onExportCsv={handleExportCsv}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-bg-muted/50 border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4 text-right">In stock</th>
              <th className="py-3 px-4 text-right">Minimum</th>
              <th className="py-3 px-4 text-right">Value at cost</th>
              <th className="py-3 px-4 text-right">Value at selling price</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.rows.map((row) => (
              <tr key={row.variantId} className="hover:bg-bg-hover/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary">{row.productName}</td>
                <td className="py-3 px-4 text-text-secondary">{row.sizeLabel}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">{row.inStock}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-muted">{row.minStock}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">{formatPeso(row.valueAtCost)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">{formatPeso(row.valueAtSellingPrice)}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.status === 'In stock'
                        ? 'bg-success-light text-success'
                        : 'bg-danger-light text-danger'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {summary.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-muted">
                  No inventory variants match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-bg-muted/60 border-t-2 border-border font-bold text-text-primary">
              <td colSpan={2} className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right tabular-nums">{summary.totalUnitsInStock}</td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4 text-right tabular-nums">{formatPeso(summary.totalValueAtCost)}</td>
              <td className="py-3 px-4 text-right tabular-nums">{formatPeso(summary.totalValueAtSellingPrice)}</td>
              <td className="py-3 px-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
