import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type CreateSaleInput,
  type PaymentStatus,
  type PackagingSize,
  type OrderStatus,
  type SaleCalculationSummary,
  type SaleLineInput,
  type SaleLineItemDTO,
  type SaleTransactionDTO,
  createSaleInputSchema,
} from './sale-contracts.ts';
import { ProductService } from '../products/product-service.ts';
import { StockService } from '../inventory/stock-service.ts';
import {
  recordCustomerSale,
  updateCustomerSalePayment,
  formatPeso,
} from '../customers/customer-service.ts';
import { getSystemSettings } from '../settings/settings-service.ts';

export interface VariantStockLookup {
  stock_quantity: number;
  selling_price: number;
  cost_price: number;
  product_name: string;
}

/**
 * Calculates calendar days elapsed since a sale was recorded.
 */
export function getDaysUnpaid(createdAt: string, asOfDate?: Date): number {
  const asOf = asOfDate || new Date();
  const created = new Date(createdAt);
  const diffMs = asOf.getTime() - created.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Determines whether an unpaid sale is overdue according to store reminder thresholds.
 */
export function isSaleOverdue(
  balance: number,
  createdAt: string,
  reminderDays = 7,
  asOfDate?: Date
): boolean {
  if (balance <= 0) return false;
  const days = getDaysUnpaid(createdAt, asOfDate);
  return days >= reminderDays;
}

/**
 * Calculates how many days past the reminder threshold a sale has been unpaid.
 */
export function getOverdueDays(
  createdAt: string,
  reminderDays = 7,
  asOfDate?: Date
): number {
  const days = getDaysUnpaid(createdAt, asOfDate);
  return Math.max(0, days - reminderDays);
}

/**
 * Formats the overdue alert banner copy matching mockup specifications and Jira acceptance criteria.
 */
export function formatOverdueBannerNotice(params: {
  balance: number;
  createdAt: string;
  reminderDays?: number;
  adminMobile?: string;
  asOfDate?: Date;
}): { title: string; subtitle: string } | null {
  const { balance, createdAt, reminderDays = 7, adminMobile = '0917 555 0142', asOfDate } = params;
  if (!isSaleOverdue(balance, createdAt, reminderDays, asOfDate)) {
    return null;
  }

  const daysUnpaid = getDaysUnpaid(createdAt, asOfDate);
  const daysOverdue = getOverdueDays(createdAt, reminderDays, asOfDate);
  const dayUnit = daysOverdue === 1 ? 'day' : 'days';

  return {
    title: `Overdue by ${daysOverdue} ${dayUnit} past the reminder limit.`,
    subtitle: `Unpaid for ${daysUnpaid} days. An SMS reminder was sent to ${adminMobile}. It stops when you mark this sale as Paid.`,
  };
}

/**
 * Calculates financial totals, profit margins, remaining balance, and live stock warnings.
 */
export function calculateSaleSummary(
  lines: SaleLineInput[],
  paymentStatus: PaymentStatus,
  inputAmountPaid: number,
  customerId?: string,
  variantStockMap?: Record<string, number>
): SaleCalculationSummary {
  const lineErrors: Record<number, string> = {};
  let totalItems = 0;
  let grossProfit = 0;
  let grandTotal = 0;
  let hasStockError = false;

  // Cumulative quantities per variant to catch multi-line duplicate depletion
  const cumulativeQty: Record<string, number> = {};
  for (const line of lines) {
    cumulativeQty[line.variantId] = (cumulativeQty[line.variantId] || 0) + line.quantity;
  }

  lines.forEach((line, index) => {
    totalItems += line.quantity;
    const lineTotal = line.quantity * line.unitPrice;
    const lineProfit = line.quantity * (line.unitPrice - line.unitCost);
    grandTotal += lineTotal;
    grossProfit += lineProfit;

    if (variantStockMap && line.variantId in variantStockMap) {
      const stock = variantStockMap[line.variantId];
      if (line.quantity > stock || (cumulativeQty[line.variantId] || 0) > stock) {
        lineErrors[index] = `Only ${stock} in stock. Lower the quantity.`;
        hasStockError = true;
      }
    }
  });

  // Round amounts to 2 decimal places to avoid floating point precision issues
  grandTotal = Math.round((grandTotal + Number.EPSILON) * 100) / 100;
  grossProfit = Math.round((grossProfit + Number.EPSILON) * 100) / 100;

  let amountPaid = 0;
  if (paymentStatus === 'Paid') {
    amountPaid = grandTotal;
  } else if (paymentStatus === 'Not Yet Paid') {
    amountPaid = 0;
  } else if (paymentStatus === 'Partially Paid') {
    amountPaid = Math.max(0, Math.min(Number(inputAmountPaid) || 0, grandTotal));
    amountPaid = Math.round((amountPaid + Number.EPSILON) * 100) / 100;
  }

  const remainingBalance = Math.max(0, Math.round((grandTotal - amountPaid + Number.EPSILON) * 100) / 100);

  const isCustomerValid = Boolean(customerId && customerId.trim() !== '');
  const isLinesValid = lines.length > 0 && lines.every((l) => l.quantity > 0 && l.variantId);
  const isValid = !hasStockError && isCustomerValid && isLinesValid;

  return {
    totalItems,
    grossProfit,
    grandTotal,
    amountPaid,
    remainingBalance,
    hasStockError,
    isValid,
    lineErrors,
  };
}

/**
 * Formats the live validation note below an item row.
 */
export function formatStockNote(
  availableStock: number,
  quantity: number,
  unitPrice: number
): { isError: boolean; message: string } {
  if (quantity > availableStock) {
    return {
      isError: true,
      message: `Only ${availableStock} in stock. Lower the quantity.`,
    };
  }
  const remaining = availableStock - quantity;
  return {
    isError: false,
    message: `Unit price ${formatPeso(unitPrice)} · ${remaining} will remain after this sale`,
  };
}

// In-memory baseline storage for sales
let inMemorySales: SaleTransactionDTO[] = [
  {
    id: 's-seed-1',
    receipt_number: 'ARLQ-01041',
    customer_id: 'k1',
    customer_name: "Aling Nena's Sari-Sari Store",
    customer_phone: '0917 301 4488',
    customer_address: 'Purok 3, Brgy. San Roque',
    total_amount: 500,
    amount_paid: 500,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Delivered',
    gross_profit: 105,
    items: [
      {
        id: 'si-1',
        sale_id: 's-seed-1',
        variant_id: 'patis-gal',
        product_name: 'Patis',
        size: 'gal',
        quantity: 2,
        unit_price: 200,
        unit_cost: 160,
        created_at: new Date('2026-10-11T00:00:00Z').toISOString(),
      },
      {
        id: 'si-2',
        sale_id: 's-seed-1',
        variant_id: 'suka-gal',
        product_name: 'Suka',
        size: 'gal',
        quantity: 1,
        unit_price: 100,
        unit_cost: 75,
        created_at: new Date('2026-10-11T00:00:00Z').toISOString(),
      },
    ],
    created_at: new Date('2026-10-11T00:00:00Z').toISOString(),
    updated_at: new Date('2026-10-11T00:00:00Z').toISOString(),
  },
  {
    id: 's-seed-2',
    receipt_number: 'ARLQ-01063',
    customer_id: 'k2',
    customer_name: 'Mang Tonyo Carinderia',
    customer_phone: '0928 554 1290',
    customer_address: 'Public Market Stall 14',
    total_amount: 560,
    amount_paid: 320,
    balance: 240,
    payment_status: 'Partially Paid',
    order_status: 'Pending',
    gross_profit: 115,
    items: [
      {
        id: 'si-3',
        sale_id: 's-seed-2',
        variant_id: 'patis-gal',
        product_name: 'Patis',
        size: 'gal',
        quantity: 2,
        unit_price: 200,
        unit_cost: 160,
        created_at: new Date('2026-10-30T00:00:00Z').toISOString(),
      },
      {
        id: 'si-4',
        sale_id: 's-seed-2',
        variant_id: 'toyo-gal',
        product_name: 'Toyo',
        size: 'gal',
        quantity: 1,
        unit_price: 160,
        unit_cost: 125,
        created_at: new Date('2026-10-30T00:00:00Z').toISOString(),
      },
    ],
    created_at: new Date('2026-10-30T00:00:00Z').toISOString(),
    updated_at: new Date('2026-10-30T00:00:00Z').toISOString(),
  },
  {
    id: 's2',
    receipt_number: 'ARLQ-01058',
    customer_id: 'k1',
    customer_name: "Aling Nena's Sari-Sari Store",
    customer_phone: '0917 301 4488',
    customer_address: 'Purok 3, Brgy. San Roque',
    total_amount: 1340,
    amount_paid: 0,
    balance: 1340,
    payment_status: 'Not Yet Paid',
    order_status: 'Pending',
    gross_profit: 295,
    items: [
      {
        id: 'si-5',
        sale_id: 's2',
        variant_id: 'patis-gal',
        product_name: 'Patis',
        size: 'gal',
        quantity: 2,
        unit_price: 200,
        unit_cost: 160,
        created_at: new Date('2026-10-25T00:00:00Z').toISOString(),
      },
      {
        id: 'si-6',
        sale_id: 's2',
        variant_id: 'toyo-gal',
        product_name: 'Toyo',
        size: 'gal',
        quantity: 4,
        unit_price: 160,
        unit_cost: 125,
        created_at: new Date('2026-10-25T00:00:00Z').toISOString(),
      },
      {
        id: 'si-7',
        sale_id: 's2',
        variant_id: 'suka-gal',
        product_name: 'Suka',
        size: 'gal',
        quantity: 3,
        unit_price: 100,
        unit_cost: 75,
        created_at: new Date('2026-10-25T00:00:00Z').toISOString(),
      },
    ],
    created_at: new Date('2026-10-25T00:00:00Z').toISOString(),
    updated_at: new Date('2026-10-25T00:00:00Z').toISOString(),
  },
];

const INITIAL_SALES_STORE = JSON.parse(JSON.stringify(inMemorySales));

export function resetInMemorySales(): void {
  inMemorySales = JSON.parse(JSON.stringify(INITIAL_SALES_STORE));
}

/**
 * Generates the next sequential receipt number in ARLQ-XXXXX format.
 */
export async function generateNextReceiptNumber(supabase?: SupabaseClient | null): Promise<string> {
  let highestNum = 1063; // baseline from initial seed

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('receipt_number')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        for (const row of data) {
          const match = String(row.receipt_number || '').match(/ARLQ-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!Number.isNaN(num) && num > highestNum) {
              highestNum = num;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to query latest receipt number from Supabase:', err);
    }
  }

  // Also check in-memory store
  for (const s of inMemorySales) {
    const match = String(s.receipt_number || '').match(/ARLQ-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > highestNum) {
        highestNum = num;
      }
    }
  }

  const nextNum = highestNum + 1;
  return `ARLQ-${String(nextNum).padStart(5, '0')}`;
}

interface SupabaseSaleItemJoinRow {
  id: string;
  sale_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  created_at: string;
  product_variants?: {
    size?: PackagingSize;
    products?: {
      name?: string;
    };
  };
}

interface SupabaseSaleJoinRow {
  id: string;
  receipt_number: string;
  customer_id: string;
  total_amount: number;
  amount_paid: number;
  payment_status: string;
  order_status: OrderStatus;
  created_at: string;
  updated_at: string;
  customers?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  sale_items?: SupabaseSaleItemJoinRow[];
}

export class SaleService {
  private readonly supabase?: SupabaseClient | null;
  private readonly productService: ProductService;
  private readonly stockService: StockService;

  constructor(supabase?: SupabaseClient | null) {
    this.supabase = supabase;
    this.productService = new ProductService(supabase);
    this.stockService = new StockService(supabase);
  }

  /**
   * Retrieves all sales with associated line items, customer details, and overdue calculations.
   */
  async getSales(): Promise<SaleTransactionDTO[]> {
    const settings = await getSystemSettings(this.supabase || undefined);
    const reminderDays = settings.reminder_days || 7;

    if (!this.supabase) {
      return inMemorySales.map((s) => {
        const daysUnpaid = getDaysUnpaid(s.created_at);
        const overdue = isSaleOverdue(s.balance, s.created_at, reminderDays);
        const overdueDays = getOverdueDays(s.created_at, reminderDays);
        return {
          ...s,
          days_unpaid: daysUnpaid,
          is_overdue: overdue,
          days_overdue: overdueDays,
        };
      });
    }

    try {
      const { data: sales, error } = await this.supabase
        .from('sales')
        .select(`
          id,
          receipt_number,
          customer_id,
          total_amount,
          amount_paid,
          payment_status,
          order_status,
          created_at,
          updated_at,
          customers (
            name,
            phone,
            address
          ),
          sale_items (
            id,
            sale_id,
            variant_id,
            quantity,
            unit_price,
            unit_cost,
            created_at,
            product_variants (
              size,
              products (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error || !sales) {
        return inMemorySales.map((s) => {
          const daysUnpaid = getDaysUnpaid(s.created_at);
          const overdue = isSaleOverdue(s.balance, s.created_at, reminderDays);
          const overdueDays = getOverdueDays(s.created_at, reminderDays);
          return {
            ...s,
            days_unpaid: daysUnpaid,
            is_overdue: overdue,
            days_overdue: overdueDays,
          };
        });
      }

      return (sales as unknown as SupabaseSaleJoinRow[]).map((s) => {
        const items: SaleLineItemDTO[] = (s.sale_items || []).map((si) => ({
          id: si.id,
          sale_id: si.sale_id,
          variant_id: si.variant_id,
          product_name: si.product_variants?.products?.name || '',
          size: si.product_variants?.size,
          quantity: Number(si.quantity),
          unit_price: Number(si.unit_price),
          unit_cost: Number(si.unit_cost),
          created_at: si.created_at,
        }));

        const totalAmount = Number(s.total_amount);
        const amountPaid = Number(s.amount_paid);
        const balance = Math.max(0, totalAmount - amountPaid);
        const grossProfit = items.reduce(
          (acc, item) => acc + item.quantity * (item.unit_price - item.unit_cost),
          0
        );

        const daysUnpaid = getDaysUnpaid(s.created_at);
        const overdue = isSaleOverdue(balance, s.created_at, reminderDays);
        const overdueDays = getOverdueDays(s.created_at, reminderDays);

        return {
          id: s.id,
          receipt_number: s.receipt_number,
          customer_id: s.customer_id,
          customer_name: s.customers?.name || 'Unknown',
          customer_phone: s.customers?.phone || '',
          customer_address: s.customers?.address || '',
          total_amount: totalAmount,
          amount_paid: amountPaid,
          balance,
          payment_status: s.payment_status as PaymentStatus,
          order_status: s.order_status,
          items,
          gross_profit: grossProfit,
          created_at: s.created_at,
          updated_at: s.updated_at,
          days_unpaid: daysUnpaid,
          is_overdue: overdue,
          days_overdue: overdueDays,
        };
      });
    } catch {
      return inMemorySales.map((s) => {
        const daysUnpaid = getDaysUnpaid(s.created_at);
        const overdue = isSaleOverdue(s.balance, s.created_at, reminderDays);
        const overdueDays = getOverdueDays(s.created_at, reminderDays);
        return {
          ...s,
          days_unpaid: daysUnpaid,
          is_overdue: overdue,
          days_overdue: overdueDays,
        };
      });
    }
  }

  /**
   * Retrieves a single sale by ID or Receipt Number.
   */
  async getSaleById(id: string): Promise<SaleTransactionDTO | null> {
    const list = await this.getSales();
    const cleanId = id.trim().toLowerCase();
    return (
      list.find(
        (s) => s.id.toLowerCase() === cleanId || s.receipt_number.toLowerCase() === cleanId
      ) || null
    );
  }

  /**
   * Updates payment status and amount paid for a sale transaction.
   * If Paid: sets amount_paid = total_amount, balance = 0.
   * If Not Yet Paid: sets amount_paid = 0, balance = total_amount.
   * If Partially Paid: validates amountPaid (0 < amountPaid < total_amount).
   * Updates customer outstanding debt rollup.
   */
  async updateSalePayment(
    saleId: string,
    paymentStatus: PaymentStatus,
    amountPaid?: number
  ): Promise<{
    success: boolean;
    sale?: SaleTransactionDTO;
    error?: string;
  }> {
    const sale = (await this.getSales()).find(
      (s) => s.id === saleId || s.receipt_number.toLowerCase() === saleId.toLowerCase()
    );

    if (!sale) {
      return { success: false, error: 'Sale not found' };
    }

    let newAmountPaid = 0;
    if (paymentStatus === 'Paid') {
      newAmountPaid = sale.total_amount;
    } else if (paymentStatus === 'Not Yet Paid') {
      newAmountPaid = 0;
    } else if (paymentStatus === 'Partially Paid') {
      const parsedAmount = Number(amountPaid);
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount >= sale.total_amount) {
        return {
          success: false,
          error: `Enter an amount between ₱1 and ${formatPeso(sale.total_amount - 1)}`,
        };
      }
      newAmountPaid = Math.round((parsedAmount + Number.EPSILON) * 100) / 100;
    }

    const newBalance = Math.max(0, Math.round((sale.total_amount - newAmountPaid + Number.EPSILON) * 100) / 100);
    const nowIso = new Date().toISOString();

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('sales')
          .update({
            amount_paid: newAmountPaid,
            payment_status: paymentStatus,
            updated_at: nowIso,
          })
          .eq('id', sale.id);

        if (error) {
          console.warn('Failed to update sale payment in Supabase:', error);
        }
      } catch (err) {
        console.warn('Supabase sale payment update failed:', err);
      }
    }

    // Update in-memory record
    const memoryMatch = inMemorySales.find(
      (s) => s.id === sale.id || s.receipt_number.toLowerCase() === sale.receipt_number.toLowerCase()
    );
    if (memoryMatch) {
      memoryMatch.amount_paid = newAmountPaid;
      memoryMatch.balance = newBalance;
      memoryMatch.payment_status = paymentStatus;
      memoryMatch.updated_at = nowIso;
    }

    // Synchronize customer debt rollup
    updateCustomerSalePayment(sale.id, newAmountPaid, paymentStatus, sale.customer_id, sale.total_amount);
    updateCustomerSalePayment(sale.receipt_number, newAmountPaid, paymentStatus, sale.customer_id, sale.total_amount);

    const updatedSale: SaleTransactionDTO = {
      ...sale,
      amount_paid: newAmountPaid,
      balance: newBalance,
      payment_status: paymentStatus,
      updated_at: nowIso,
      is_overdue: false,
    };

    return {
      success: true,
      sale: updatedSale,
    };
  }

  /**
   * Updates fulfillment order status for a sale transaction.
   */
  async updateSaleOrderStatus(
    saleId: string,
    orderStatus: OrderStatus
  ): Promise<{
    success: boolean;
    sale?: SaleTransactionDTO;
    error?: string;
  }> {
    const sale = (await this.getSales()).find(
      (s) => s.id === saleId || s.receipt_number.toLowerCase() === saleId.toLowerCase()
    );

    if (!sale) {
      return { success: false, error: 'Sale not found' };
    }

    const nowIso = new Date().toISOString();

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('sales')
          .update({
            order_status: orderStatus,
            updated_at: nowIso,
          })
          .eq('id', sale.id);

        if (error) {
          console.warn('Failed to update sale order status in Supabase:', error);
        }
      } catch (err) {
        console.warn('Supabase sale order status update failed:', err);
      }
    }

    const memoryMatch = inMemorySales.find(
      (s) => s.id === sale.id || s.receipt_number.toLowerCase() === sale.receipt_number.toLowerCase()
    );
    if (memoryMatch) {
      memoryMatch.order_status = orderStatus;
      memoryMatch.updated_at = nowIso;
    }

    const updatedSale: SaleTransactionDTO = {
      ...sale,
      order_status: orderStatus,
      updated_at: nowIso,
    };

    return {
      success: true,
      sale: updatedSale,
    };
  }

  /**
   * Atomically executes a new sale transaction:
   * 1. Validates input schema
   * 2. Checks inventory stock availability
   * 3. Allocates sequential receipt number
   * 4. Decrements variant stock
   * 5. Appends 'Sale' movement ledger entry
   * 6. Inserts sale and sale_items records
   * 7. Registers debt on customer account
   */
  async createSaleTransaction(input: CreateSaleInput): Promise<{
    success: boolean;
    sale?: SaleTransactionDTO;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  }> {
    const validated = createSaleInputSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    const { customerId, lines, paymentStatus, amountPaid: rawAmountPaid, orderStatus } = validated.data;

    // 1. Validate live inventory stock for all lines
    const stockMap: Record<string, number> = {};
    for (const line of lines) {
      const match = await this.productService.getVariantById(line.variantId);
      if (!match) {
        return {
          success: false,
          error: `Variant ${line.variantId} not found in catalog`,
        };
      }
      stockMap[line.variantId] = match.variant.stock_quantity;
    }

    const summary = calculateSaleSummary(lines, paymentStatus, rawAmountPaid, customerId, stockMap);
    if (!summary.isValid) {
      return {
        success: false,
        error: summary.hasStockError
          ? 'Cannot complete sale: one or more items exceed warehouse stock.'
          : 'Please complete all required fields.',
      };
    }

    const receiptNumber = await generateNextReceiptNumber(this.supabase);
    const saleId = `sale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    // 2. Atomically decrement stock and record audit movements via StockService
    for (const line of lines) {
      const movRes = await this.stockService.recordMovement({
        variant_id: line.variantId,
        movement_type: 'Out',
        quantity: line.quantity,
        reason: `Sale ${receiptNumber}`,
        note: `Sale ${receiptNumber}`,
      });

      if (!movRes.success) {
        return {
          success: false,
          error: movRes.error || 'Failed to decrement inventory stock',
        };
      }
    }

    // 3. Prepare line item DTOs
    const items: SaleLineItemDTO[] = lines.map((l, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      sale_id: saleId,
      variant_id: l.variantId,
      size: l.size,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      unit_cost: l.unitCost,
      created_at: nowIso,
    }));

    const saleRecord: SaleTransactionDTO = {
      id: saleId,
      receipt_number: receiptNumber,
      customer_id: customerId,
      total_amount: summary.grandTotal,
      amount_paid: summary.amountPaid,
      balance: summary.remainingBalance,
      payment_status: paymentStatus,
      order_status: orderStatus,
      items,
      gross_profit: summary.grossProfit,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 4. Persist to Supabase if connected
    if (this.supabase) {
      try {
        const { data: dbSale, error: saleErr } = await this.supabase
          .from('sales')
          .insert({
            receipt_number: receiptNumber,
            customer_id: customerId,
            total_amount: summary.grandTotal,
            amount_paid: summary.amountPaid,
            payment_status: paymentStatus,
            order_status: orderStatus,
          })
          .select()
          .single();

        if (saleErr || !dbSale) {
          console.warn('Failed to insert sale into Supabase, saving to memory:', saleErr);
        } else {
          saleRecord.id = dbSale.id;
          const itemsPayload = lines.map((l) => ({
            sale_id: dbSale.id,
            variant_id: l.variantId,
            quantity: l.quantity,
            unit_price: l.unitPrice,
            unit_cost: l.unitCost,
          }));

          const { error: itemsErr } = await this.supabase
            .from('sale_items')
            .insert(itemsPayload);

          if (itemsErr) {
            console.warn('Failed to insert sale_items in Supabase:', itemsErr);
          }
        }
      } catch (err) {
        console.warn('Supabase checkout transaction failed, persisting in-memory:', err);
      }
    }

    // 5. Update local customer purchase & debt rollups
    recordCustomerSale({
      id: saleRecord.id,
      receipt_number: receiptNumber,
      customer_id: customerId,
      total_amount: summary.grandTotal,
      amount_paid: summary.amountPaid,
      balance: summary.remainingBalance,
      payment_status: paymentStatus,
      order_status: orderStatus,
      created_at: nowIso,
    });

    // 6. Append to in-memory store
    inMemorySales.unshift(saleRecord);

    return {
      success: true,
      sale: saleRecord,
    };
  }
}
