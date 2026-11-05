'use client';

import { useState, useMemo } from 'react';
import { ReportToolbar } from './report-toolbar';
import {
  aggregateLowStockReport,
  type ProductReference,
  type VariantReference,
} from '@/lib/reports/report-service';
import { downloadCsvFile } from '@/lib/reports/csv-export';

export interface LowStockReportViewProps {
  products: ProductReference[];
  variants: VariantReference[];
}

export function LowStockReportView({ products, variants }: LowStockReportViewProps) {
  const [productId, setProductId] = useState<string>('all');
  const [size, setSize] = useState<string>('all');

  const summary = useMemo(() => {
    return aggregateLowStockReport(variants, products, { productId, size });
  }, [variants, products, productId, size]);

  const handleExportCsv = () => {
    const rows = summary.rows.map((r) => [
      r.productName,
      r.sizeLabel,
      r.inStock,
      r.minStock,
      r.shortBy,
    ]);

    const footer = ['Total Shortfall', '', '', '', summary.totalShortfallUnits];

    downloadCsvFile({
      filename: `arlq-low-stock-report`,
      headers: ['Product', 'Size', 'In Stock', 'Minimum', 'Short By'],
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
              <th className="py-3 px-4 text-right">Short by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.rows.map((row) => (
              <tr key={row.variantId} className="hover:bg-bg-hover/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary">{row.productName}</td>
                <td className="py-3 px-4 text-text-secondary">{row.sizeLabel}</td>
                <td className="py-3 px-4 text-right tabular-nums font-bold text-danger">{row.inStock}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-secondary">{row.minStock}</td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold text-danger">{row.shortBy}</td>
              </tr>
            ))}
            {summary.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5 text-text-muted">
                    <p className="font-semibold text-text-primary text-base">Nothing to report</p>
                    <p className="text-sm">No variants are below the minimum for this filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {summary.rows.length > 0 && (
            <tfoot>
              <tr className="bg-bg-muted/60 border-t-2 border-border font-bold text-text-primary">
                <td colSpan={4} className="py-3 px-4">Total Shortfall Units</td>
                <td className="py-3 px-4 text-right tabular-nums text-danger">{summary.totalShortfallUnits}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
