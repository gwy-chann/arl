'use client';

import { useState, useMemo } from 'react';
import { ReportToolbar } from './report-toolbar';
import {
  aggregateProfitReport,
  type ProductReference,
  type VariantReference,
  type SaleReference,
} from '@/lib/reports/report-service';
import type { ReportRangeDays } from '@/lib/reports/report-contracts';
import { downloadCsvFile } from '@/lib/reports/csv-export';
import { formatPeso } from '@/lib/customers/customer-service';

export interface ProfitReportViewProps {
  products: ProductReference[];
  variants: VariantReference[];
  sales: SaleReference[];
}

export function ProfitReportView({ products, variants, sales }: ProfitReportViewProps) {
  const [range, setRange] = useState<ReportRangeDays>('30');
  const [productId, setProductId] = useState<string>('all');
  const [size, setSize] = useState<string>('all');

  const summary = useMemo(() => {
    return aggregateProfitReport(
      sales,
      variants,
      products,
      { range, productId, size }
    );
  }, [sales, variants, products, range, productId, size]);

  const handleExportCsv = () => {
    const rows = summary.rows.map((r) => [
      r.productName,
      r.sizeLabel,
      r.bottlesSold,
      r.revenue,
      r.cost,
      r.profit,
      `${r.marginPercent}%`,
    ]);

    const footer = [
      'Total',
      '',
      summary.totalBottlesSold,
      summary.totalRevenue,
      summary.totalCost,
      summary.totalProfit,
      `${summary.weightedMarginPercent}%`,
    ];

    downloadCsvFile({
      filename: `arlq-earnings-profit-report-${range}days`,
      headers: ['Product', 'Size', 'Bottles Sold', 'Revenue', 'Cost', 'Profit', 'Margin %'],
      rows,
      footer,
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
              <th className="py-3 px-4 text-right">Sold</th>
              <th className="py-3 px-4 text-right">Revenue</th>
              <th className="py-3 px-4 text-right">Cost</th>
              <th className="py-3 px-4 text-right">Profit</th>
              <th className="py-3 px-4 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.rows.map((row) => (
              <tr key={row.variantId} className="hover:bg-bg-hover/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary">{row.productName}</td>
                <td className="py-3 px-4 text-text-secondary">{row.sizeLabel}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">{row.bottlesSold}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-primary font-medium">{formatPeso(row.revenue)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-secondary">{formatPeso(row.cost)}</td>
                <td className="py-3 px-4 text-right tabular-nums font-bold text-success">{formatPeso(row.profit)}</td>
                <td className="py-3 px-4 text-right tabular-nums font-medium text-text-primary">{row.marginPercent}%</td>
              </tr>
            ))}
            {summary.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5 text-text-muted">
                    <p className="font-semibold text-text-primary text-base">No sales in this range</p>
                    <p className="text-sm">Try a longer range or another product.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {summary.rows.length > 0 && (
            <tfoot>
              <tr className="bg-bg-muted/60 border-t-2 border-border font-bold text-text-primary">
                <td colSpan={2} className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-right tabular-nums">{summary.totalBottlesSold}</td>
                <td className="py-3 px-4 text-right tabular-nums">{formatPeso(summary.totalRevenue)}</td>
                <td className="py-3 px-4 text-right tabular-nums">{formatPeso(summary.totalCost)}</td>
                <td className="py-3 px-4 text-right tabular-nums text-success">{formatPeso(summary.totalProfit)}</td>
                <td className="py-3 px-4 text-right tabular-nums">{summary.weightedMarginPercent}%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
