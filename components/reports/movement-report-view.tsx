'use client';

import { useState, useMemo } from 'react';
import { ReportToolbar } from './report-toolbar';
import {
  aggregateMovementReport,
  type ProductReference,
  type VariantReference,
  type StockMovementReference,
} from '@/lib/reports/report-service';
import type { ReportRangeDays } from '@/lib/reports/report-contracts';
import { downloadCsvFile } from '@/lib/reports/csv-export';

export interface MovementReportViewProps {
  products: ProductReference[];
  variants: VariantReference[];
  movements: StockMovementReference[];
}

export function MovementReportView({ products, variants, movements }: MovementReportViewProps) {
  const [range, setRange] = useState<ReportRangeDays>('30');
  const [productId, setProductId] = useState<string>('all');
  const [size, setSize] = useState<string>('all');

  const summary = useMemo(() => {
    return aggregateMovementReport(
      movements,
      variants,
      products,
      { range, productId, size }
    );
  }, [movements, variants, products, range, productId, size]);

  const handleExportCsv = () => {
    const rows = summary.rows.map((r) => [
      r.productName,
      r.sizeLabel,
      r.stockIn,
      r.stockOut,
      r.netChange,
      r.currentStock,
    ]);

    downloadCsvFile({
      filename: `arlq-stock-movement-report-${range}days`,
      headers: ['Product', 'Size', 'Stock In', 'Stock Out', 'Net Change', 'Now in Stock'],
      rows,
    });
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
      <ReportToolbar
        range={range}
        onRangeChange={setRange}
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
              <th className="py-3 px-4 text-right">Stock in</th>
              <th className="py-3 px-4 text-right">Stock out</th>
              <th className="py-3 px-4 text-right">Net change</th>
              <th className="py-3 px-4 text-right">Now in stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.rows.map((row) => (
              <tr key={row.variantId} className="hover:bg-bg-hover/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary">{row.productName}</td>
                <td className="py-3 px-4 text-text-secondary">{row.sizeLabel}</td>
                <td className="py-3 px-4 text-right tabular-nums text-success font-medium">+{row.stockIn}</td>
                <td className="py-3 px-4 text-right tabular-nums text-danger font-medium">-{row.stockOut}</td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold text-text-primary">
                  {row.netChange >= 0 ? `+${row.netChange}` : row.netChange}
                </td>
                <td className="py-3 px-4 text-right tabular-nums font-medium text-text-primary">{row.currentStock}</td>
              </tr>
            ))}
            {summary.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted">
                  No stock movements recorded for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
