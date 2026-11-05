/**
 * Domain Contracts & Schemas: Multi-Dimensional Tabbed Reporting Suite
 * Feature: ARL-20 (013-tabbed-reporting-suite)
 */

import { z } from 'zod';

export const reportTabSchema = z.enum([
  'sales',
  'inventory',
  'movement',
  'low',
  'balances',
  'profit',
]);

export type ReportTab = z.infer<typeof reportTabSchema>;

export const reportPeriodSchema = z.enum(['daily', 'weekly', 'monthly']);
export type ReportPeriod = z.infer<typeof reportPeriodSchema>;

export const reportRangeSchema = z.enum(['7', '30', '90']);
export type ReportRangeDays = z.infer<typeof reportRangeSchema>;

export const reportFilterSchema = z.object({
  tab: reportTabSchema.default('sales'),
  period: reportPeriodSchema.default('daily'),
  range: reportRangeSchema.default('30'),
  productId: z.string().default('all'),
  size: z.string().default('all'),
});

export type ReportFilterState = z.infer<typeof reportFilterSchema>;

export interface SalesReportRow {
  periodLabel: string;
  transactionsCount: number;
  bottlesSold: number;
  revenue: number;
  profit: number;
}

export interface SalesReportSummary {
  rows: SalesReportRow[];
  totalTransactions: number;
  totalBottlesSold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface InventoryReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  inStock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  valueAtCost: number;
  valueAtSellingPrice: number;
  status: 'In stock' | 'Low stock' | 'Out of stock';
}

export interface InventoryReportSummary {
  rows: InventoryReportRow[];
  totalUnitsInStock: number;
  totalValueAtCost: number;
  totalValueAtSellingPrice: number;
}

export interface MovementReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  stockIn: number;
  stockOut: number;
  netChange: number;
  currentStock: number;
}

export interface MovementReportSummary {
  rows: MovementReportRow[];
  rangeDays: number;
}

export interface LowStockReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  inStock: number;
  minStock: number;
  shortBy: number;
}

export interface LowStockReportSummary {
  rows: LowStockReportRow[];
  totalShortfallUnits: number;
}

export interface CustomerBalanceReportRow {
  customerId: string;
  customerName: string;
  unpaidSalesCount: number;
  balance: number;
}

export interface CustomerBalanceReportSummary {
  rows: CustomerBalanceReportRow[];
  totalUnpaidSales: number;
  totalOutstandingBalance: number;
}

export interface ProfitReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  bottlesSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface ProfitReportSummary {
  rows: ProfitReportRow[];
  rangeDays: number;
  totalBottlesSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  weightedMarginPercent: number;
}

export interface CsvExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  footer?: (string | number)[];
}
