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
  lines: z.array(saleLineInputSchema).min(1, 'At least one line item is required'),
  paymentStatus: PaymentStatusEnum,
  amountPaid: z.number().min(0, 'Amount paid cannot be negative'),
  orderStatus: OrderStatusEnum,
});
export type CreateSaleInput = z.infer<typeof createSaleInputSchema>;

export interface SaleItemEntity {
  id: string;
  sale_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  created_at: string;
}

export interface SaleWithItems {
  id: string;
  receipt_number: string;
  customer_id: string;
  customer_name?: string;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  items: SaleItemEntity[];
  gross_profit?: number;
  created_at: string;
  updated_at: string;
}
