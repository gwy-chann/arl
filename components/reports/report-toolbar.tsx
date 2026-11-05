'use client';

import type { ReportPeriod, ReportRangeDays } from '@/lib/reports/report-contracts';
import type { ProductReference } from '@/lib/reports/report-service';

export interface ReportToolbarProps {
  // Period filter (for sales)
  period?: ReportPeriod;
  onPeriodChange?: (period: ReportPeriod) => void;

  // Range filter (for movement & profit)
  range?: ReportRangeDays;
  onRangeChange?: (range: ReportRangeDays) => void;

  // Product filter
  productId?: string;
  products?: ProductReference[];
  onProductChange?: (productId: string) => void;

  // Size filter
  size?: string;
  onSizeChange?: (size: string) => void;

  // Action callbacks
  onExportCsv?: () => void;
  onPrint?: () => void;
}

export function ReportToolbar({
  period,
  onPeriodChange,
  range,
  onRangeChange,
  productId,
  products = [],
  onProductChange,
  size,
  onSizeChange,
  onExportCsv,
  onPrint,
}: ReportToolbarProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2.5 p-3.5 border-b border-border bg-bg-muted/30 no-print"
      aria-label="Report filter toolbar"
    >
      {/* Period Dropdown */}
      {period !== undefined && onPeriodChange && (
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as ReportPeriod)}
          aria-label="Period"
          className="bg-bg-input border border-border text-text-primary rounded-md text-sm px-3 py-1.5 focus:border-border-focus focus:outline-none cursor-pointer"
        >
          <option value="daily">Daily (last 7 days)</option>
          <option value="weekly">Weekly (last 4 weeks)</option>
          <option value="monthly">Monthly (last 3 months)</option>
        </select>
      )}

      {/* Range Dropdown */}
      {range !== undefined && onRangeChange && (
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value as ReportRangeDays)}
          aria-label="Range"
          className="bg-bg-input border border-border text-text-primary rounded-md text-sm px-3 py-1.5 focus:border-border-focus focus:outline-none cursor-pointer"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      )}

      {/* Product Dropdown */}
      {productId !== undefined && onProductChange && (
        <select
          value={productId}
          onChange={(e) => onProductChange(e.target.value)}
          aria-label="Product"
          className="bg-bg-input border border-border text-text-primary rounded-md text-sm px-3 py-1.5 focus:border-border-focus focus:outline-none cursor-pointer"
        >
          <option value="all">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Size Dropdown */}
      {size !== undefined && onSizeChange && (
        <select
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          aria-label="Size"
          className="bg-bg-input border border-border text-text-primary rounded-md text-sm px-3 py-1.5 focus:border-border-focus focus:outline-none cursor-pointer"
        >
          <option value="all">All sizes</option>
          <option value="350">350 ml</option>
          <option value="1L">1 L</option>
          <option value="gal">1 Gallon</option>
        </select>
      )}

      {/* Flex Spacer */}
      <span className="flex-1" />

      {/* Export CSV Button */}
      {onExportCsv && (
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors cursor-pointer shadow-xs"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      )}

      {/* Print Report Button */}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors cursor-pointer shadow-xs"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print report
      </button>
    </div>
  );
}
