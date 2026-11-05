'use client';

import { useState, useMemo } from 'react';
import { ReportToolbar } from './report-toolbar';
import {
  aggregateSalesReport,
  type ProductReference,
  type VariantReference,
  type SaleReference,
} from '@/lib/reports/report-service';
import type { ReportPeriod } from '@/lib/reports/report-contracts';
import { downloadCsvFile } from '@/lib/reports/csv-export';
import { formatPeso } from '@/lib/customers/customer-service';

export interface SalesReportViewProps {
  products: ProductReference[];
  variants: VariantReference[];
  sales: SaleReference[];
}

export function SalesReportView({ products, variants, sales }: SalesReportViewProps) {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [productId, setProductId] = useState<string>('all');
  const [size, setSize] = useState<string>('all');

  const summary = useMemo(() => {
    return aggregateSalesReport(
      sales,
      products,
      variants,
      { tab: 'sales', period, range: '30', productId, size }
    );
  }, [sales, products, variants, period, productId, size]);

  const handleExportCsv = () => {
    const rows = summary.rows.map((r) => [
      r.periodLabel,
      r.transactionsCount,
      r.bottlesSold,
      r.revenue,
      r.profit,
    ]);

    const footer = [
      'Total',
      summary.totalTransactions,
      summary.totalBottlesSold,
      summary.totalRevenue,
      summary.totalProfit,
    ];

    downloadCsvFile({
      filename: `arlq-sales-report-${period}`,
      headers: ['Period', 'Transactions', 'Bottles Sold', 'Sales Revenue', 'Profit'],
      rows,
      footer,
    });
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
      <ReportToolbar
        period={period}
        onPeriodChange={setPeriod}
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
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4 text-right">Transactions</th>
              <th className="py-3 px-4 text-right">Bottles sold</th>
              <th className="py-3 px-4 text-right">Sales</th>
              <th className="py-3 px-4 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-bg-hover/50 transition-colors">
                <td className="py-3 px-4 font-medium text-text-primary">{row.periodLabel}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-secondary">{row.transactionsCount}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-secondary">{row.bottlesSold}</td>
                <td className="py-3 px-4 text-right tabular-nums font-medium text-text-primary">{formatPeso(row.revenue)}</td>
                <td className="py-3 px-4 text-right tabular-nums font-medium text-text-primary">{formatPeso(row.profit)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-bg-muted/60 border-t-2 border-border font-bold text-text-primary">
              <td className="py-3 px-4">Total</td>
              <td className="py-3 px-4 text-right tabular-nums">{summary.totalTransactions}</td>
              <td className="py-3 px-4 text-right tabular-nums">{summary.totalBottlesSold}</td>
              <td className="py-3 px-4 text-right tabular-nums">{formatPeso(summary.totalRevenue)}</td>
              <td className="py-3 px-4 text-right tabular-nums">{formatPeso(summary.totalProfit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
