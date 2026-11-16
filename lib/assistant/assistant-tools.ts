import type { SupabaseClient } from '@supabase/supabase-js';
import { ProductService } from '../products/product-service.ts';
import { SaleService } from '../sales/sale-service.ts';
import { getCustomerDirectory } from '../customers/customer-service.ts';
import { getSystemSettings } from '../settings/settings-service.ts';
import {
  formatPhilippinePeso,
  formatPackagingSize,
  InventorySummaryInputSchema,
  InventorySummaryResultSchema,
  SalesOverviewInputSchema,
  SalesOverviewResultSchema,
  CustomerBalancesInputSchema,
  CustomerBalancesResultSchema,
  StoreSettingsInputSchema,
  StoreSettingsResultSchema,
  AssistantToolNameEnum,
  type InventorySummaryInput,
  type InventorySummaryResult,
  type InventoryVariantItem,
  type SalesOverviewInput,
  type SalesOverviewResult,
  type CustomerBalancesInput,
  type CustomerBalancesResult,
  type IndebtedCustomerItem,
  type StoreSettingsInput,
  type StoreSettingsResult,
  type AssistantToolName,
} from './assistant-grounding-contracts.ts';

/**
 * Returns formatted YYYY-MM-DD in the Asia/Manila (UTC+8) timezone.
 */
function getManilaDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);
}

/**
 * Calculates calendar days elapsed between created date and current time.
 */
function calculateDaysElapsed(createdAt: string, now: Date = new Date()): number {
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// 1. getInventorySummary
// ---------------------------------------------------------------------------

export async function getInventorySummary(
  input: InventorySummaryInput = {},
  client?: SupabaseClient | null
): Promise<InventorySummaryResult> {
  const validated = InventorySummaryInputSchema.parse(input);
  const productService = new ProductService(client);
  const products = await productService.getProducts();

  const flatVariants: InventoryVariantItem[] = [];

  for (const prod of products) {
    for (const v of prod.variants || []) {
      const canonicalSize = formatPackagingSize(v.size);
      const isLowStock = v.stock_quantity <= v.min_stock_level;
      const costPrice = Number(v.cost_price) || 0;
      const sellingPrice = Number(v.selling_price) || 0;

      flatVariants.push({
        id: v.id,
        productName: prod.name,
        variantName: `${prod.name} ${canonicalSize}`,
        size: canonicalSize,
        stockQuantity: v.stock_quantity,
        minStockLevel: v.min_stock_level,
        isLowStock,
        costPrice,
        sellingPrice,
        formattedSellingPrice: formatPhilippinePeso(sellingPrice),
      });
    }
  }

  let filtered = flatVariants;

  if (validated.searchQuery && validated.searchQuery.trim()) {
    const q = validated.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.variantName.toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q)
    );
  }

  if (validated.lowStockOnly) {
    filtered = filtered.filter((item) => item.isLowStock);
  }

  const lowStockCount = filtered.filter((item) => item.isLowStock).length;

  const result: InventorySummaryResult = {
    items: filtered,
    totalVariants: filtered.length,
    lowStockCount,
  };

  return InventorySummaryResultSchema.parse(result);
}

// ---------------------------------------------------------------------------
// 2. getSalesOverview
// ---------------------------------------------------------------------------

export async function getSalesOverview(
  input: SalesOverviewInput,
  client?: SupabaseClient | null
): Promise<SalesOverviewResult> {
  const validated = SalesOverviewInputSchema.parse(input);
  const saleService = new SaleService(client);
  const sales = await saleService.getSales();

  const now = new Date();
  const todayManilaStr = getManilaDateString(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayManilaStr = getManilaDateString(yesterday);

  const currentMonthPrefix = todayManilaStr.substring(0, 7); // YYYY-MM

  const filteredSales = sales.filter((s) => {
    const saleDate = new Date(s.created_at);
    const saleManilaStr = getManilaDateString(saleDate);

    switch (validated.timeframe) {
      case 'today':
        return saleManilaStr === todayManilaStr;
      case 'yesterday':
        return saleManilaStr === yesterdayManilaStr;
      case 'last_7_days': {
        const diffMs = now.getTime() - saleDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      case 'current_month':
        return saleManilaStr.startsWith(currentMonthPrefix);
      case 'all':
      default:
        return true;
    }
  });

  let totalGrossRevenue = 0;
  let totalCashCollected = 0;
  let totalOutstandingBalance = 0;
  let paidCount = 0;
  let partiallyPaidCount = 0;
  let notPaidCount = 0;

  for (const s of filteredSales) {
    totalGrossRevenue += Number(s.total_amount) || 0;
    totalCashCollected += Number(s.amount_paid) || 0;
    totalOutstandingBalance += Number(s.balance) || 0;

    if (s.payment_status === 'paid') {
      paidCount++;
    } else if (s.payment_status === 'partially_paid') {
      partiallyPaidCount++;
    } else {
      notPaidCount++;
    }
  }

  const result: SalesOverviewResult = {
    timeframe: validated.timeframe,
    totalSalesCount: filteredSales.length,
    totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
    formattedGrossRevenue: formatPhilippinePeso(totalGrossRevenue),
    totalCashCollected: Math.round(totalCashCollected * 100) / 100,
    formattedCashCollected: formatPhilippinePeso(totalCashCollected),
    totalOutstandingBalance: Math.round(totalOutstandingBalance * 100) / 100,
    formattedOutstandingBalance: formatPhilippinePeso(totalOutstandingBalance),
    paymentBreakdown: {
      paidCount,
      partiallyPaidCount,
      notPaidCount,
    },
  };

  return SalesOverviewResultSchema.parse(result);
}

// ---------------------------------------------------------------------------
// 3. getCustomerBalances
// ---------------------------------------------------------------------------

export async function getCustomerBalances(
  input: CustomerBalancesInput = {},
  client?: SupabaseClient | null
): Promise<CustomerBalancesResult> {
  const validated = CustomerBalancesInputSchema.parse(input);
  const saleService = new SaleService(client);
  const [customers, sales, settings] = await Promise.all([
    getCustomerDirectory(client),
    saleService.getSales(),
    getSystemSettings(client),
  ]);

  const overdueThresholdDays = settings?.reminder_days ?? 7;
  const now = new Date();

  const customerItems: IndebtedCustomerItem[] = [];

  for (const c of customers) {
    // Collect all unpaid sales for this customer
    const customerUnpaidSales = sales.filter(
      (s) =>
        s.customer_id === c.id &&
        Number(s.balance) > 0 &&
        (s.payment_status === 'not_paid' || s.payment_status === 'partially_paid')
    );

    const totalBalance = Number(c.debt_balance) || 0;

    // Only include accounts with outstanding debt
    if (totalBalance <= 0 && customerUnpaidSales.length === 0) {
      continue;
    }

    let oldestUnpaidDays = 0;
    if (customerUnpaidSales.length > 0) {
      oldestUnpaidDays = Math.max(
        ...customerUnpaidSales.map((s) => calculateDaysElapsed(s.created_at, now))
      );
    } else if (c.created_at) {
      oldestUnpaidDays = calculateDaysElapsed(c.created_at, now);
    }

    const isOverdue = oldestUnpaidDays >= overdueThresholdDays;

    customerItems.push({
      customerId: c.id,
      name: c.name,
      phone: c.phone || null,
      totalBalance: Math.round(totalBalance * 100) / 100,
      formattedTotalBalance: formatPhilippinePeso(totalBalance),
      unpaidTransactionsCount: customerUnpaidSales.length,
      oldestUnpaidDays,
      isOverdue,
    });
  }

  let filtered = customerItems;

  if (validated.customerName && validated.customerName.trim()) {
    const q = validated.customerName.trim().toLowerCase();
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
  }

  if (validated.overdueOnly) {
    filtered = filtered.filter((c) => c.isOverdue);
  }

  const totalOutstandingDebt = filtered.reduce((acc, c) => acc + c.totalBalance, 0);

  const result: CustomerBalancesResult = {
    totalIndebtedCustomers: filtered.length,
    totalOutstandingDebt: Math.round(totalOutstandingDebt * 100) / 100,
    formattedOutstandingDebt: formatPhilippinePeso(totalOutstandingDebt),
    customers: filtered,
  };

  return CustomerBalancesResultSchema.parse(result);
}

// ---------------------------------------------------------------------------
// 4. getStoreSettings
// ---------------------------------------------------------------------------

export async function getStoreSettings(
  input: StoreSettingsInput = {},
  client?: SupabaseClient | null
): Promise<StoreSettingsResult> {
  StoreSettingsInputSchema.parse(input);
  const settings = await getSystemSettings(client);

  const result: StoreSettingsResult = {
    storeName: 'ARLQ Store',
    overdueReminderDays: settings?.reminder_days ?? 7,
    reminderPhone: settings?.admin_mobile || '0917 555 0142',
    defaultMinStockLevel: 10,
    smsNotificationEnabled: settings?.notify_customer_sms ?? true,
  };

  return StoreSettingsResultSchema.parse(result);
}

// ---------------------------------------------------------------------------
// Unified Tool Call Dispatcher (Strict Read-Only Enforcement)
// ---------------------------------------------------------------------------

export async function executeToolCall(
  name: AssistantToolName,
  args: unknown,
  client?: SupabaseClient | null
): Promise<unknown> {
  const toolNameParsed = AssistantToolNameEnum.safeParse(name);
  if (!toolNameParsed.success) {
    throw new Error(`Unknown or unauthorized tool: ${String(name)}`);
  }

  switch (name) {
    case 'getInventorySummary': {
      const parsed = InventorySummaryInputSchema.parse(args || {});
      return await getInventorySummary(parsed, client);
    }
    case 'getSalesOverview': {
      const parsed = SalesOverviewInputSchema.parse(args || {});
      return await getSalesOverview(parsed, client);
    }
    case 'getCustomerBalances': {
      const parsed = CustomerBalancesInputSchema.parse(args || {});
      return await getCustomerBalances(parsed, client);
    }
    case 'getStoreSettings': {
      const parsed = StoreSettingsInputSchema.parse(args || {});
      return await getStoreSettings(parsed, client);
    }
    default:
      throw new Error(`Unknown or unauthorized tool: ${String(name)}`);
  }
}
