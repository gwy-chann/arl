/**
 * Dashboard Contracts and Validation Types (ARL-18)
 */

export interface DashboardKpiDTO {
  sales_today: number;
  transactions_today: number;
  sales_this_month: number;
  profit_this_month: number;
  outstanding_balances: number;
  unpaid_sales_count: number;
  low_stock_count: number;
  total_variants_count: number;
}

export interface SalesChartDayDTO {
  day_offset: number; // 6 to 0 (0 is Today)
  date_iso: string;
  day_label: string; // "Today" or short weekday ("Mon", "Tue")
  revenue: number;
  height_percentage: number; // 1.5 to 100
  is_today: boolean;
}

export interface StockMatrixCellDTO {
  variant_id: string;
  size_key: '350' | '1L' | 'gal';
  size_label: string;
  stock_quantity: number;
  min_stock_level: number;
  capacity_percentage: number;
  is_low: boolean;
}

export interface StockMatrixRowDTO {
  product_id: string;
  product_name: string;
  category_name?: string | null;
  variants: StockMatrixCellDTO[];
}

export type UrgentNoticeType = 'overdue_debt' | 'low_stock';

export interface UrgentNoticeDTO {
  id: string;
  type: UrgentNoticeType;
  title: string;
  message: string;
  subtitle: string;
  badge_tone: 'bad' | 'warn';
  action_label: string;
  action_href: string;
}

export interface CustomerDebtRankingDTO {
  customer_id: string;
  customer_name: string;
  total_debt: number;
  oldest_unpaid_days: number;
  is_overdue: boolean;
}

export interface DashboardDataDTO {
  kpis: DashboardKpiDTO;
  sales_chart: SalesChartDayDTO[];
  stock_matrix: StockMatrixRowDTO[];
  notices: UrgentNoticeDTO[];
  debt_ranking: CustomerDebtRankingDTO[];
  as_of: string;
}

/**
 * Currency formatter matching ARLQ mockup standards
 */
export function formatPeso(amount: number, showDecimals: boolean = false): string {
  const formatted = Math.abs(amount).toLocaleString('en-PH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  return `${amount < 0 ? '-' : ''}₱${formatted}`;
}

/**
 * Compute capacity meter percentage for an inventory variant
 */
export function computeStockCapacityPercentage(stock: number, minStock: number): number {
  if (minStock <= 0) return 100;
  return Math.min(Math.max((stock / (minStock * 2.5)) * 100, 0), 100);
}
