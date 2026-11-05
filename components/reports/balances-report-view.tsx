'use client';

import { useMemo } from 'react';
import { ReportToolbar } from './report-toolbar';
import {
  aggregateCustomerBalancesReport,
  type CustomerReference,
  type SaleReference,
} from '@/lib/reports/report-service';
import { downloadCsvFile } from '@/lib/reports/csv-export';
import { formatPeso } from '@/lib/customers/customer-service';

export interface BalancesReportViewProps {
  customers: CustomerReference[];
  sales: SaleReference[];
}

export function BalancesReportView({ customers, sales }: BalancesReportViewProps) {
  const summary = useMemo(() => {
    return aggregateCustomerBalancesReport(customers, sales);
  }, [customers, sales]);

  const handleExportCsv = () => {
    const rows = summary.rows.map((r) => [
      r.customerName,
      r.unpaidSalesCount,
      r.balance,
    ]);

    const footer = [
      'Total',
      summary.totalUnpaidSales,
      summary.totalOutstandingBalance,
    ];

    downloadCsvFile({
      filename: `arlq-customer-balances-report`,
      headers: ['Customer', 'Unpaid Sales', 'Outstanding Balance'],
      rows,
      footer,
    });
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg shadow-xs overflow-hidden">
      <ReportToolbar onExportCsv={handleExportCsv} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-bg-muted/50 border-b border-border text-xs uppercase text-text-muted font-semibold tracking-wider">
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 text-right">Unpaid sales</th>
              <th className="py-3 px-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.rows.map((row) => (
              <tr key={row.customerId} className="hover:bg-bg-hover/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-text-primary">{row.customerName}</td>
                <td className="py-3 px-4 text-right tabular-nums text-text-secondary">{row.unpaidSalesCount}</td>
                <td className="py-3 px-4 text-right tabular-nums font-bold text-danger">{formatPeso(row.balance)}</td>
              </tr>
            ))}
            {summary.rows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5 text-text-muted">
                    <p className="font-semibold text-text-primary text-base">No balances</p>
                    <p className="text-sm">Every customer is fully paid.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {summary.rows.length > 0 && (
            <tfoot>
              <tr className="bg-bg-muted/60 border-t-2 border-border font-bold text-text-primary">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-right tabular-nums">{summary.totalUnpaidSales}</td>
                <td className="py-3 px-4 text-right tabular-nums text-danger">{formatPeso(summary.totalOutstandingBalance)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
