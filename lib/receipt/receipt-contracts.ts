import { z } from 'zod';

export const ReceiptItemSchema = z.object({
  id: z.string(),
  variant_id: z.string(),
  variant_label: z.string().min(1),
  product_name: z.string().min(1),
  packaging_size: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  line_total: z.number().nonnegative(),
});

export const ReceiptPaymentStatusSchema = z.enum([
  'PAID',
  'PARTIALLY PAID',
  'NOT YET PAID',
]);

export const ReceiptSnapshotSchema = z.object({
  id: z.string(),
  receipt_number: z.string(),
  created_at: z.string(),
  formatted_date: z.string(),
  customer_id: z.string(),
  customer_name: z.string().min(1),
  items: z.array(ReceiptItemSchema).min(1),
  total_amount: z.number().nonnegative(),
  amount_paid: z.number().nonnegative(),
  balance: z.number().nonnegative(),
  payment_status: ReceiptPaymentStatusSchema,
});

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type ReceiptPaymentStatus = z.infer<typeof ReceiptPaymentStatusSchema>;
export type ReceiptSnapshot = z.infer<typeof ReceiptSnapshotSchema>;
