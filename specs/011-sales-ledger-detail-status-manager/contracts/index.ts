import { z } from 'zod';

export const PaymentStatusEnum = z.enum(['Paid', 'Partially Paid', 'Not Yet Paid']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const OrderStatusEnum = z.enum(['Pending', 'Delivered', 'Picked Up']);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

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
  size?: '350' | '1L' | 'gal';
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
  days_unpaid?: number;
  is_overdue?: boolean;
  days_overdue?: number;
}
