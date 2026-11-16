import { z } from 'zod';

/**
 * Standard Packaging Sizes in ARLQ Condiment Catalog
 */
export const PackagingSizeEnum = z.enum(['350 ml', '1 L', '1 gal']);
export type PackagingSize = z.infer<typeof PackagingSizeEnum>;

/**
 * Formats a number to Philippine Peso (e.g. ₱1,250.00)
 */
export function formatPhilippinePeso(amount: number): string {
  const val = Number(amount) || 0;
  return '₱' + val.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Normalizes internal size keys ('350', '1L', 'gal') to canonical labels ('350 ml', '1 L', '1 gal')
 */
export function formatPackagingSize(rawSize: string): PackagingSize {
  const clean = rawSize.toLowerCase().trim();
  if (clean === '350' || clean === '350ml' || clean === '350 ml') return '350 ml';
  if (clean === '1l' || clean === '1 l' || clean === '1 liter' || clean === 'liter') return '1 L';
  if (clean === 'gal' || clean === '1gal' || clean === '1 gal' || clean === 'gallon') return '1 gal';
  return '1 L'; // Default fallback
}

// ---------------------------------------------------------------------------
// 1. getInventorySummary Contract
// ---------------------------------------------------------------------------

export const InventorySummaryInputSchema = z.object({
  searchQuery: z.string().optional(),
  lowStockOnly: z.boolean().optional(),
});
export type InventorySummaryInput = z.infer<typeof InventorySummaryInputSchema>;

export const InventoryVariantItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  variantName: z.string(),
  size: PackagingSizeEnum,
  stockQuantity: z.number(),
  minStockLevel: z.number(),
  isLowStock: z.boolean(),
  costPrice: z.number(),
  sellingPrice: z.number(),
  formattedSellingPrice: z.string(),
});
export type InventoryVariantItem = z.infer<typeof InventoryVariantItemSchema>;

export const InventorySummaryResultSchema = z.object({
  items: z.array(InventoryVariantItemSchema),
  totalVariants: z.number(),
  lowStockCount: z.number(),
});
export type InventorySummaryResult = z.infer<typeof InventorySummaryResultSchema>;

// ---------------------------------------------------------------------------
// 2. getSalesOverview Contract
// ---------------------------------------------------------------------------

export const SalesTimeframeSchema = z.enum([
  'today',
  'yesterday',
  'last_7_days',
  'current_month',
  'all',
]);
export type SalesTimeframe = z.infer<typeof SalesTimeframeSchema>;

export const SalesOverviewInputSchema = z.object({
  timeframe: SalesTimeframeSchema,
});
export type SalesOverviewInput = z.infer<typeof SalesOverviewInputSchema>;

export const SalesPaymentBreakdownSchema = z.object({
  paidCount: z.number(),
  partiallyPaidCount: z.number(),
  notPaidCount: z.number(),
});
export type SalesPaymentBreakdown = z.infer<typeof SalesPaymentBreakdownSchema>;

export const SalesOverviewResultSchema = z.object({
  timeframe: SalesTimeframeSchema,
  totalSalesCount: z.number(),
  totalGrossRevenue: z.number(),
  formattedGrossRevenue: z.string(),
  totalCashCollected: z.number(),
  formattedCashCollected: z.string(),
  totalOutstandingBalance: z.number(),
  formattedOutstandingBalance: z.string(),
  paymentBreakdown: SalesPaymentBreakdownSchema,
});
export type SalesOverviewResult = z.infer<typeof SalesOverviewResultSchema>;

// ---------------------------------------------------------------------------
// 3. getCustomerBalances Contract
// ---------------------------------------------------------------------------

export const CustomerBalancesInputSchema = z.object({
  overdueOnly: z.boolean().optional(),
  customerName: z.string().optional(),
});
export type CustomerBalancesInput = z.infer<typeof CustomerBalancesInputSchema>;

export const IndebtedCustomerItemSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  totalBalance: z.number(),
  formattedTotalBalance: z.string(),
  unpaidTransactionsCount: z.number(),
  oldestUnpaidDays: z.number(),
  isOverdue: z.boolean(),
});
export type IndebtedCustomerItem = z.infer<typeof IndebtedCustomerItemSchema>;

export const CustomerBalancesResultSchema = z.object({
  totalIndebtedCustomers: z.number(),
  totalOutstandingDebt: z.number(),
  formattedOutstandingDebt: z.string(),
  customers: z.array(IndebtedCustomerItemSchema),
});
export type CustomerBalancesResult = z.infer<typeof CustomerBalancesResultSchema>;

// ---------------------------------------------------------------------------
// 4. getStoreSettings Contract
// ---------------------------------------------------------------------------

export const StoreSettingsInputSchema = z.object({});
export type StoreSettingsInput = z.infer<typeof StoreSettingsInputSchema>;

export const StoreSettingsResultSchema = z.object({
  storeName: z.string(),
  overdueReminderDays: z.number(),
  reminderPhone: z.string(),
  defaultMinStockLevel: z.number(),
  smsNotificationEnabled: z.boolean(),
});
export type StoreSettingsResult = z.infer<typeof StoreSettingsResultSchema>;

// ---------------------------------------------------------------------------
// Tool Names & Gemini Function Declaration Schemas
// ---------------------------------------------------------------------------

export const AssistantToolNameEnum = z.enum([
  'getInventorySummary',
  'getSalesOverview',
  'getCustomerBalances',
  'getStoreSettings',
]);
export type AssistantToolName = z.infer<typeof AssistantToolNameEnum>;

export interface GeminiFunctionDeclaration {
  name: AssistantToolName;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, {
      type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export const ASSISTANT_TOOL_DECLARATIONS: GeminiFunctionDeclaration[] = [
  {
    name: 'getInventorySummary',
    description: 'Retrieves current stock levels, packaging sizes, cost/retail prices, and low-stock warnings for ARLQ condiments (Toyo, Suka, Patis).',
    parameters: {
      type: 'OBJECT',
      properties: {
        searchQuery: {
          type: 'STRING',
          description: 'Optional product name or condiment to filter (e.g. "Toyo", "Suka", "Patis").',
        },
        lowStockOnly: {
          type: 'BOOLEAN',
          description: 'If true, returns only items where current stock <= minimum stock level.',
        },
      },
    },
  },
  {
    name: 'getSalesOverview',
    description: 'Summarizes gross sales revenue, cash collected, outstanding credit, and order volume across timeframes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        timeframe: {
          type: 'STRING',
          enum: ['today', 'yesterday', 'last_7_days', 'current_month', 'all'],
          description: 'The time window to aggregate sales.',
        },
      },
      required: ['timeframe'],
    },
  },
  {
    name: 'getCustomerBalances',
    description: 'Retrieves customer credit balances (utang), identifying overdue accounts based on the store reminder threshold.',
    parameters: {
      type: 'OBJECT',
      properties: {
        overdueOnly: {
          type: 'BOOLEAN',
          description: 'If true, filters strictly for customers with unpaid balances exceeding the store threshold (default 7 days).',
        },
        customerName: {
          type: 'STRING',
          description: 'Optional partial customer name to search specific balance.',
        },
      },
    },
  },
  {
    name: 'getStoreSettings',
    description: 'Retrieves store operating configuration, SMS notification settings, and default overdue balance thresholds.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];
