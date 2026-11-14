import { z } from 'zod';

export const PackagingSizeEnum = z.enum(['350', '1L', 'gal']);
export type PackagingSize = z.infer<typeof PackagingSizeEnum>;

export const PaymentStatusEnum = z.enum(['Paid', 'Partially Paid', 'Not Yet Paid']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const OrderStatusEnum = z.enum(['Pending', 'Delivered', 'Picked Up']);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const saleLineInputSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().min(1, 'Variant is required'),
  size: PackagingSizeEnum,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
});
export type SaleLineInput = z.infer<typeof saleLineInputSchema>;

export const createSaleInputSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  lines: z.array(saleLineInputSchema).min(1, 'At least one item is required'),
  paymentStatus: PaymentStatusEnum,
  amountPaid: z.number().min(0, 'Amount paid cannot be negative'),
  orderStatus: OrderStatusEnum.default('Pending'),
});
export type CreateSaleInput = z.infer<typeof createSaleInputSchema>;

export const updateSalePaymentSchema = z.object({
  saleId: z.string().min(1, 'Sale ID is required'),
  paymentStatus: PaymentStatusEnum,
  amountPaid: z.number().min(0, 'Amount paid cannot be negative').optional(),
});
export type UpdateSalePaymentInput = z.infer<typeof updateSalePaymentSchema>;

export const updateSaleOrderStatusSchema = z.object({
  saleId: z.string().min(1, 'Sale ID is required'),
  orderStatus: OrderStatusEnum,
});
export type UpdateSaleOrderStatusInput = z.infer<typeof updateSaleOrderStatusSchema>;

export interface SaleLineItemDTO {
  id: string;
  sale_id: string;
  variant_id: string;
  product_name?: string;
  size?: PackagingSize;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  created_at: string;
}

export interface SaleTransactionDTO {
  id: string;
  receipt_number: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  items: SaleLineItemDTO[];
  gross_profit: number;
  created_at: string;
  updated_at: string;
  last_sms_sent_at?: string | null;
  days_unpaid?: number;
  is_overdue?: boolean;
  days_overdue?: number;
}

export interface SaleCalculationSummary {
  totalItems: number;
  grossProfit: number;
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;
  hasStockError: boolean;
  isValid: boolean;
  lineErrors: Record<number, string>;
}
