/**
 * RFC 4180 CSV Exporter Utility
 * Feature: ARL-20 (013-tabbed-reporting-suite)
 */

import type { CsvExportOptions } from './report-contracts.ts';

/**
 * Sanitizes and escapes a cell value according to RFC 4180 rules.
 */
export function escapeCsvCell(cell: string | number | null | undefined): string {
  if (cell === null || cell === undefined) {
    return '';
  }
  const str = String(cell);
  // If cell contains commas, quotes, or newlines, quote it and double-up internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string from options.
 */
export function generateCsvString(options: CsvExportOptions): string {
  const lines: string[] = [];

  // Header row
  if (options.headers && options.headers.length > 0) {
    lines.push(options.headers.map(escapeCsvCell).join(','));
  }

  // Data rows
  for (const row of options.rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }

  // Summary / Footer row
  if (options.footer && options.footer.length > 0) {
    lines.push(options.footer.map(escapeCsvCell).join(','));
  }

  return lines.join('\r\n');
}

/**
 * Triggers a browser download for the generated CSV file.
 * Returns the generated CSV content string.
 */
export function downloadCsvFile(options: CsvExportOptions): string {
  const csvContent = generateCsvString(options);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}
