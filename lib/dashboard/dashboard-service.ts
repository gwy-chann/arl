import type { SupabaseClient } from '@supabase/supabase-js';
import { SaleService } from '../sales/sale-service.ts';
import { ProductService } from '../products/product-service.ts';
import { getCustomerDirectory } from '../customers/customer-service.ts';
import { getSystemSettings } from '../settings/settings-service.ts';
import {
  type DashboardKpiDTO,
  type SalesChartDayDTO,
  type StockMatrixRowDTO,
  type StockMatrixCellDTO,
  type UrgentNoticeDTO,
  type CustomerDebtRankingDTO,
  type DashboardDataDTO,
  formatPeso,
  computeStockCapacityPercentage,
} from './dashboard-contracts.ts';
import type { SaleTransactionDTO } from '../sales/sale-contracts.ts';
import type { ProductWithVariants, ProductSizeKey } from '../products/product-service.ts';

function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const SIZE_LABELS: Record<ProductSizeKey, string> = {
  '350': '350 ml',
  '1L': '1 L',
  'gal': '1 gal',
};

const STANDARD_SIZES: ProductSizeKey[] = ['350', '1L', 'gal'];

export class DashboardService {
  private readonly supabase?: SupabaseClient | null;
  private readonly saleService: SaleService;
  private readonly productService: ProductService;

  constructor(supabase?: SupabaseClient | null) {
    this.supabase = supabase;
    this.saleService = new SaleService(supabase);
    this.productService = new ProductService(supabase);
  }

  /**
   * Aggregates all KPI, sales chart, inventory matrix, notice stream, and debt data for the dashboard.
   */
  async getDashboardData(asOfDate?: Date): Promise<DashboardDataDTO> {
    const asOf = asOfDate || new Date();
    const settings = await getSystemSettings(this.supabase || undefined);
    const reminderDays = settings.reminder_days || 7;

    const [sales, products, customers] = await Promise.all([
      this.saleService.getSales(),
      this.productService.getProducts(),
      getCustomerDirectory(this.supabase),
    ]);

    const customerMap = new Map(customers.map((c) => [c.id, c.name]));

    // 1. KPI Metrics
    const kpis = this.calculateKpis(sales, products, asOf);

    // 2. 7-Day Rolling Sales Chart
    const salesChart = this.buildSalesChart(sales, asOf);

    // 3. Stock on Hand 3x3 Matrix
    const stockMatrix = this.buildStockMatrix(products);

    // 4. Urgent Notices (Overdue sales + Low stock variants)
    const notices = this.buildUrgentNotices(sales, products, reminderDays, asOf);

    // 5. Who Owes You Debtor Ranking (Top 5)
    const debtRanking = this.buildDebtRanking(sales, customerMap, reminderDays, asOf);

    return {
      kpis,
      sales_chart: salesChart,
      stock_matrix: stockMatrix,
      notices,
      debt_ranking: debtRanking,
      as_of: asOf.toISOString(),
    };
  }

  public calculateKpis(
    sales: SaleTransactionDTO[],
    products: ProductWithVariants[],
    asOf: Date
  ): DashboardKpiDTO {
    // Sales Today
    const todaySales = sales.filter((s) => isSameCalendarDay(new Date(s.created_at), asOf));
    const salesToday = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const transactionsToday = todaySales.length;

    // Sales This Month
    const currentMonth = asOf.getMonth();
    const currentYear = asOf.getFullYear();
    const monthSales = sales.filter((s) => {
      const d = new Date(s.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const salesThisMonth = monthSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const profitThisMonth = monthSales.reduce((sum, s) => {
      if (typeof s.gross_profit === 'number') {
        return sum + s.gross_profit;
      }
      if (s.items && s.items.length > 0) {
        const itemProfit = s.items.reduce(
          (pSum, it) => pSum + ((it.unit_price || 0) - (it.unit_cost || 0)) * (it.quantity || 1),
          0
        );
        return sum + itemProfit;
      }
      return sum + (s.total_amount || 0) * 0.25;
    }, 0);

    // Outstanding balances across unpaid sales
    const unpaidSales = sales.filter((s) => (s.balance || 0) > 0);
    const outstandingBalances = unpaidSales.reduce((sum, s) => sum + (s.balance || 0), 0);
    const unpaidSalesCount = unpaidSales.length;

    // Low stock variants count
    let lowStockCount = 0;
    let totalVariantsCount = 0;
    for (const p of products) {
      for (const v of p.variants) {
        totalVariantsCount++;
        if (v.stock_quantity <= v.min_stock_level) {
          lowStockCount++;
        }
      }
    }

    return {
      sales_today: salesToday,
      transactions_today: transactionsToday,
      sales_this_month: salesThisMonth,
      profit_this_month: profitThisMonth,
      outstanding_balances: outstandingBalances,
      unpaid_sales_count: unpaidSalesCount,
      low_stock_count: lowStockCount,
      total_variants_count: totalVariantsCount,
    };
  }

  public buildSalesChart(sales: SaleTransactionDTO[], asOf: Date): SalesChartDayDTO[] {
    const daysOffsets = [6, 5, 4, 3, 2, 1, 0];
    const dailyTotals: { offset: number; date: Date; total: number }[] = [];

    for (const offset of daysOffsets) {
      const targetDate = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate() - offset);
      const daySales = sales.filter((s) => isSameCalendarDay(new Date(s.created_at), targetDate));
      const total = daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      dailyTotals.push({ offset, date: targetDate, total });
    }

    const maxTotal = Math.max(...dailyTotals.map((d) => d.total), 1);

    return dailyTotals.map((d) => {
      const isToday = d.offset === 0;
      const dayLabel = isToday
        ? 'Today'
        : d.date.toLocaleDateString('en-PH', { weekday: 'short' });
      const heightPercentage = Math.max((d.total / maxTotal) * 100, 1.5);

      return {
        day_offset: d.offset,
        date_iso: d.date.toISOString(),
        day_label: dayLabel,
        revenue: d.total,
        height_percentage: heightPercentage,
        is_today: isToday,
      };
    });
  }

  public buildStockMatrix(products: ProductWithVariants[]): StockMatrixRowDTO[] {
    return products.map((p) => {
      const cells: StockMatrixCellDTO[] = STANDARD_SIZES.map((sizeKey) => {
        const variant = p.variants.find((v) => v.size === sizeKey);
        if (!variant) {
          return {
            variant_id: `${p.id}-${sizeKey}`,
            size_key: sizeKey,
            size_label: SIZE_LABELS[sizeKey],
            stock_quantity: 0,
            min_stock_level: 0,
            capacity_percentage: 0,
            is_low: false,
          };
        }

        const capacity = computeStockCapacityPercentage(
          variant.stock_quantity,
          variant.min_stock_level
        );
        const isLow = variant.stock_quantity <= variant.min_stock_level;

        return {
          variant_id: variant.id,
          size_key: sizeKey,
          size_label: SIZE_LABELS[sizeKey],
          stock_quantity: variant.stock_quantity,
          min_stock_level: variant.min_stock_level,
          capacity_percentage: capacity,
          is_low: isLow,
        };
      });

      return {
        product_id: p.id,
        product_name: p.name,
        category_name: p.category_name,
        variants: cells,
      };
    });
  }

  public buildUrgentNotices(
    sales: SaleTransactionDTO[],
    products: ProductWithVariants[],
    reminderDays: number,
    asOf: Date
  ): UrgentNoticeDTO[] {
    const notices: UrgentNoticeDTO[] = [];

    // 1. Overdue Sales notices
    const overdueSales = sales
      .filter((s) => (s.balance || 0) > 0)
      .map((s) => {
        const created = new Date(s.created_at);
        const diffDays = Math.max(
          0,
          Math.floor((asOf.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        );
        return {
          sale: s,
          daysUnpaid: diffDays,
          isOverdue: diffDays >= reminderDays,
        };
      })
      .filter((item) => item.isOverdue)
      .sort((a, b) => b.daysUnpaid - a.daysUnpaid);

    for (const item of overdueSales) {
      const s = item.sale;
      const customerName = s.customer_name || 'Customer';
      notices.push({
        id: `notice-overdue-${s.id}`,
        type: 'overdue_debt',
        title: customerName,
        message: `owes ${formatPeso(s.balance, true)}`,
        subtitle: `Receipt ${s.receipt_number} · unpaid for ${item.daysUnpaid} days · SMS reminder sent`,
        badge_tone: 'bad',
        action_label: 'Open sale',
        action_href: `/sales/${s.id}`,
      });
    }

    // 2. Low stock notices
    const lowStockVariants: {
      productName: string;
      sizeLabel: string;
      stock: number;
      min: number;
      id: string;
    }[] = [];

    for (const p of products) {
      for (const v of p.variants) {
        if (v.stock_quantity <= v.min_stock_level) {
          lowStockVariants.push({
            id: v.id,
            productName: p.name,
            sizeLabel: SIZE_LABELS[v.size as ProductSizeKey] || v.size,
            stock: v.stock_quantity,
            min: v.min_stock_level,
          });
        }
      }
    }

    // Sort lowest stock first
    lowStockVariants.sort((a, b) => a.stock / (a.min || 1) - b.stock / (b.min || 1));

    for (const v of lowStockVariants) {
      notices.push({
        id: `notice-low-${v.id}`,
        type: 'low_stock',
        title: `${v.productName} - ${v.sizeLabel}`,
        message: 'is running low',
        subtitle: `${v.stock} left · minimum is ${v.min}`,
        badge_tone: 'warn',
        action_label: 'Stock in',
        action_href: '/inventory/in',
      });
    }

    return notices;
  }

  public buildDebtRanking(
    sales: SaleTransactionDTO[],
    customerMap?: Map<string, string>,
    reminderDays: number = 7,
    asOf: Date = new Date()
  ): CustomerDebtRankingDTO[] {
    const debtorMap: Record<
      string,
      { customer_id: string; customer_name: string; total_debt: number; oldest_unpaid_days: number }
    > = {};

    for (const s of sales) {
      const balance = s.balance || 0;
      if (balance > 0) {
        const cid = s.customer_id;
        const name = (customerMap && customerMap.get(cid)) || s.customer_name || 'Customer';
        const created = new Date(s.created_at);
        const daysUnpaid = Math.max(
          0,
          Math.floor((asOf.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        );

        if (!debtorMap[cid]) {
          debtorMap[cid] = {
            customer_id: cid,
            customer_name: name,
            total_debt: 0,
            oldest_unpaid_days: 0,
          };
        }

        debtorMap[cid].total_debt += balance;
        debtorMap[cid].oldest_unpaid_days = Math.max(
          debtorMap[cid].oldest_unpaid_days,
          daysUnpaid
        );
      }
    }

    return Object.values(debtorMap)
      .sort((a, b) => b.total_debt - a.total_debt)
      .slice(0, 5)
      .map((d) => ({
        customer_id: d.customer_id,
        customer_name: d.customer_name,
        total_debt: d.total_debt,
        oldest_unpaid_days: d.oldest_unpaid_days,
        is_overdue: d.oldest_unpaid_days >= reminderDays,
      }));
  }
}
