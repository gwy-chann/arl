/**
 * Domain Service: Multi-Dimensional Reporting Aggregation Engine
 * Feature: ARL-20 (013-tabbed-reporting-suite)
 */

import { getSizeLabel } from '../../specs/006-multi-variant-product-catalog/contracts/product-contracts.ts';
import type {
  ReportFilterState,
  SalesReportSummary,
  SalesReportRow,
  InventoryReportSummary,
  InventoryReportRow,
  MovementReportSummary,
  MovementReportRow,
  LowStockReportSummary,
  LowStockReportRow,
  CustomerBalanceReportSummary,
  CustomerBalanceReportRow,
  ProfitReportSummary,
  ProfitReportRow,
} from './report-contracts.ts';

export interface ProductReference {
  id: string;
  name: string;
}

export interface VariantReference {
  id: string;
  product_id: string;
  size: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
}

export interface SaleItemReference {
  id?: string;
  sale_id?: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
}

export interface SaleReference {
  id: string;
  receipt_number: string;
  customer_id: string;
  total_amount: number;
  amount_paid: number;
  created_at: string;
  items?: SaleItemReference[];
}

export interface StockMovementReference {
  id: string;
  variant_id: string;
  movement_type: 'In' | 'Out' | 'Sale';
  quantity: number;
  created_at: string;
}

export interface CustomerReference {
  id: string;
  name: string;
}

/**
 * Checks whether a variant matches the active product and size filters.
 */
export function filterMatchesVariant(
  variant: VariantReference,
  filter: Pick<ReportFilterState, 'productId' | 'size'>
): boolean {
  const matchProduct = filter.productId === 'all' || variant.product_id === filter.productId;
  const matchSize = filter.size === 'all' || variant.size === filter.size;
  return matchProduct && matchSize;
}

/**
 * Calculates stock status label for a variant.
 */
export function getVariantStockStatus(
  stockQuantity: number,
  minStockLevel: number
): 'In stock' | 'Low stock' | 'Out of stock' {
  if (stockQuantity <= 0) {
    return 'Out of stock';
  }
  if (stockQuantity <= minStockLevel) {
    return 'Low stock';
  }
  return 'In stock';
}

/**
 * Calculates weighted profit margin percentage safely rounded to integer.
 */
export function calculateWeightedMargin(profit: number, revenue: number): number {
  if (!revenue || revenue <= 0) {
    return 0;
  }
  return Math.round((profit / revenue) * 100);
}

/**
 * Formats a date string into standard Philippine presentation (e.g., 'Oct 11, 2026').
 */
export function formatReportDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Aggregates the Sales Report with period bucketing (daily, weekly, monthly).
 */
export function aggregateSalesReport(
  sales: SaleReference[],
  products: ProductReference[],
  variants: VariantReference[],
  filter: ReportFilterState,
  referenceDate: Date = new Date()
): SalesReportSummary {
  const variantMap = new Map<string, VariantReference>(variants.map((v) => [v.id, v]));

  const matchesFilter = (variantId: string) => {
    const v = variantMap.get(variantId);
    if (!v) return false;
    return filterMatchesVariant(v, filter);
  };

  // Helper to calculate days between reference date and target
  const getDaysAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const startOfRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
    const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.floor((startOfRef - startOfTarget) / (24 * 60 * 60 * 1000));
  };

  type BucketDef = { label: string; predicate: (s: SaleReference) => boolean };
  let buckets: BucketDef[] = [];

  if (filter.period === 'daily') {
    buckets = Array.from({ length: 7 }, (_, i) => {
      const targetDate = new Date(referenceDate);
      targetDate.setDate(targetDate.getDate() - i);
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatReportDate(targetDate);
      return {
        label,
        predicate: (s) => getDaysAgo(s.created_at) === i,
      };
    });
  } else if (filter.period === 'weekly') {
    buckets = Array.from({ length: 4 }, (_, i) => {
      const label = i === 0 ? 'This week' : i === 1 ? 'Last week' : `${i} weeks ago`;
      return {
        label,
        predicate: (s) => {
          const days = getDaysAgo(s.created_at);
          return days >= i * 7 && days < (i + 1) * 7;
        },
      };
    });
  } else {
    // monthly: current month and prior 2 months
    buckets = [0, 1, 2].map((m) => {
      const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - m, 1);
      const label = ref.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        label,
        predicate: (s) => {
          const d = new Date(s.created_at);
          return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
        },
      };
    });
  }

  const rows: SalesReportRow[] = buckets.map((bucket) => {
    const bucketSales = sales.filter(bucket.predicate);
    let transactionsCount = 0;
    let bottlesSold = 0;
    let revenue = 0;
    let cost = 0;

    bucketSales.forEach((sale) => {
      const matchingItems = (sale.items || []).filter((item) => matchesFilter(item.variant_id));
      if (matchingItems.length > 0) {
        transactionsCount++;
        matchingItems.forEach((item) => {
          bottlesSold += item.quantity;
          revenue += item.quantity * item.unit_price;
          cost += item.quantity * item.unit_cost;
        });
      }
    });

    return {
      periodLabel: bucket.label,
      transactionsCount,
      bottlesSold,
      revenue,
      profit: revenue - cost,
    };
  });

  const totalTransactions = rows.reduce((acc, r) => acc + r.transactionsCount, 0);
  const totalBottlesSold = rows.reduce((acc, r) => acc + r.bottlesSold, 0);
  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
  const totalProfit = rows.reduce((acc, r) => acc + r.profit, 0);

  return {
    rows,
    totalTransactions,
    totalBottlesSold,
    totalRevenue,
    totalProfit,
  };
}

/**
 * Aggregates the Inventory Valuation Report.
 */
export function aggregateInventoryReport(
  variants: VariantReference[],
  products: ProductReference[],
  filter: Pick<ReportFilterState, 'productId' | 'size'>
): InventoryReportSummary {
  const productMap = new Map<string, ProductReference>(products.map((p) => [p.id, p]));

  const matchingVariants = variants.filter((v) => filterMatchesVariant(v, filter));

  const rows: InventoryReportRow[] = matchingVariants.map((v) => {
    const product = productMap.get(v.product_id);
    const productName = product ? product.name : 'Unknown Product';
    const valueAtCost = v.stock_quantity * v.cost_price;
    const valueAtSellingPrice = v.stock_quantity * v.selling_price;

    return {
      variantId: v.id,
      productId: v.product_id,
      productName,
      size: v.size,
      sizeLabel: getSizeLabel(v.size),
      inStock: v.stock_quantity,
      minStock: v.min_stock_level,
      costPrice: v.cost_price,
      sellingPrice: v.selling_price,
      valueAtCost,
      valueAtSellingPrice,
      status: getVariantStockStatus(v.stock_quantity, v.min_stock_level),
    };
  });

  const totalUnitsInStock = rows.reduce((acc, r) => acc + r.inStock, 0);
  const totalValueAtCost = rows.reduce((acc, r) => acc + r.valueAtCost, 0);
  const totalValueAtSellingPrice = rows.reduce((acc, r) => acc + r.valueAtSellingPrice, 0);

  return {
    rows,
    totalUnitsInStock,
    totalValueAtCost,
    totalValueAtSellingPrice,
  };
}

/**
 * Aggregates the Stock Movement Velocity Report.
 */
export function aggregateMovementReport(
  movements: StockMovementReference[],
  variants: VariantReference[],
  products: ProductReference[],
  filter: Pick<ReportFilterState, 'range' | 'productId' | 'size'>,
  referenceDate: Date = new Date()
): MovementReportSummary {
  const rangeDays = parseInt(filter.range, 10) || 30;
  const productMap = new Map<string, ProductReference>(products.map((p) => [p.id, p]));
  const refTime = referenceDate.getTime();
  const maxAgeMs = rangeDays * 24 * 60 * 60 * 1000;

  const relevantMovements = movements.filter((m) => {
    const moveTime = new Date(m.created_at).getTime();
    return refTime - moveTime <= maxAgeMs;
  });

  const matchingVariants = variants.filter((v) => filterMatchesVariant(v, filter));

  const rows: MovementReportRow[] = matchingVariants.map((v) => {
    const product = productMap.get(v.product_id);
    const productName = product ? product.name : 'Unknown Product';
    const varMoves = relevantMovements.filter((m) => m.variant_id === v.id);

    const stockIn = varMoves
      .filter((m) => m.movement_type === 'In')
      .reduce((acc, m) => acc + m.quantity, 0);

    const stockOut = varMoves
      .filter((m) => m.movement_type === 'Out' || m.movement_type === 'Sale')
      .reduce((acc, m) => acc + m.quantity, 0);

    return {
      variantId: v.id,
      productId: v.product_id,
      productName,
      size: v.size,
      sizeLabel: getSizeLabel(v.size),
      stockIn,
      stockOut,
      netChange: stockIn - stockOut,
      currentStock: v.stock_quantity,
    };
  });

  return {
    rows,
    rangeDays,
  };
}

/**
 * Aggregates the Low Stock Exceptions Report.
 */
export function aggregateLowStockReport(
  variants: VariantReference[],
  products: ProductReference[],
  filter: Pick<ReportFilterState, 'productId' | 'size'>
): LowStockReportSummary {
  const productMap = new Map<string, ProductReference>(products.map((p) => [p.id, p]));

  const lowVariants = variants.filter(
    (v) => filterMatchesVariant(v, filter) && v.stock_quantity <= v.min_stock_level
  );

  const rows: LowStockReportRow[] = lowVariants.map((v) => {
    const product = productMap.get(v.product_id);
    const productName = product ? product.name : 'Unknown Product';
    const shortBy = Math.max(0, v.min_stock_level - v.stock_quantity);

    return {
      variantId: v.id,
      productId: v.product_id,
      productName,
      size: v.size,
      sizeLabel: getSizeLabel(v.size),
      inStock: v.stock_quantity,
      minStock: v.min_stock_level,
      shortBy,
    };
  });

  const totalShortfallUnits = rows.reduce((acc, r) => acc + r.shortBy, 0);

  return {
    rows,
    totalShortfallUnits,
  };
}

/**
 * Aggregates the Customer Balances Debt Report.
 */
export function aggregateCustomerBalancesReport(
  customers: CustomerReference[],
  sales: SaleReference[]
): CustomerBalanceReportSummary {
  const rows: CustomerBalanceReportRow[] = [];

  for (const customer of customers) {
    const customerSales = sales.filter((s) => s.customer_id === customer.id);
    let unpaidSalesCount = 0;
    let customerBalance = 0;

    customerSales.forEach((sale) => {
      const remaining = Math.max(0, sale.total_amount - sale.amount_paid);
      if (remaining > 0) {
        unpaidSalesCount++;
        customerBalance += remaining;
      }
    });

    if (customerBalance > 0) {
      rows.push({
        customerId: customer.id,
        customerName: customer.name,
        unpaidSalesCount,
        balance: Math.round(customerBalance * 100) / 100,
      });
    }
  }

  // Sort descending by outstanding balance
  rows.sort((a, b) => b.balance - a.balance);

  const totalUnpaidSales = rows.reduce((acc, r) => acc + r.unpaidSalesCount, 0);
  const totalOutstandingBalance = rows.reduce((acc, r) => acc + r.balance, 0);

  return {
    rows,
    totalUnpaidSales,
    totalOutstandingBalance: Math.round(totalOutstandingBalance * 100) / 100,
  };
}

/**
 * Aggregates the Earnings & Profit Margin Report.
 */
export function aggregateProfitReport(
  sales: SaleReference[],
  variants: VariantReference[],
  products: ProductReference[],
  filter: Pick<ReportFilterState, 'range' | 'productId' | 'size'>,
  referenceDate: Date = new Date()
): ProfitReportSummary {
  const rangeDays = parseInt(filter.range, 10) || 30;
  const productMap = new Map<string, ProductReference>(products.map((p) => [p.id, p]));
  const refTime = referenceDate.getTime();
  const maxAgeMs = rangeDays * 24 * 60 * 60 * 1000;

  // Filter sales within the specified range
  const relevantSales = sales.filter((s) => {
    const saleTime = new Date(s.created_at).getTime();
    return refTime - saleTime <= maxAgeMs;
  });

  const matchingVariants = variants.filter((v) => filterMatchesVariant(v, filter));

  const rows: ProfitReportRow[] = [];

  for (const v of matchingVariants) {
    let bottlesSold = 0;
    let revenue = 0;
    let cost = 0;

    for (const sale of relevantSales) {
      const items = (sale.items || []).filter((i) => i.variant_id === v.id);
      for (const item of items) {
        bottlesSold += item.quantity;
        revenue += item.quantity * item.unit_price;
        cost += item.quantity * item.unit_cost;
      }
    }

    // Only include variants with at least 1 unit sold in this time window
    if (bottlesSold > 0) {
      const product = productMap.get(v.product_id);
      const productName = product ? product.name : 'Unknown Product';
      const profit = revenue - cost;
      const marginPercent = calculateWeightedMargin(profit, revenue);

      rows.push({
        variantId: v.id,
        productId: v.product_id,
        productName,
        size: v.size,
        sizeLabel: getSizeLabel(v.size),
        bottlesSold,
        revenue,
        cost,
        profit,
        marginPercent,
      });
    }
  }

  const totalBottlesSold = rows.reduce((acc, r) => acc + r.bottlesSold, 0);
  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
  const totalCost = rows.reduce((acc, r) => acc + r.cost, 0);
  const totalProfit = rows.reduce((acc, r) => acc + r.profit, 0);
  const weightedMarginPercent = calculateWeightedMargin(totalProfit, totalRevenue);

  return {
    rows,
    rangeDays,
    totalBottlesSold,
    totalRevenue,
    totalCost,
    totalProfit,
    weightedMarginPercent,
  };
}
