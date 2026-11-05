import { z } from 'zod';

export const saleSummarySchema = z.object({
  id: z.string().min(1),
  receipt_number: z.string().min(1),
  customer_id: z.string().min(1),
  total_amount: z.number().nonnegative(),
  amount_paid: z.number().nonnegative(),
  balance: z.number().nonnegative(),
  payment_status: z.enum(['Paid', 'Partially Paid', 'Not Yet Paid']),
  order_status: z.enum(['Pending', 'Delivered', 'Picked Up']),
  created_at: z.string().datetime(),
  days_outstanding: z.number().int().nonnegative().optional(),
  is_overdue: z.boolean().optional(),
});

export type SaleSummaryContract = z.infer<typeof saleSummarySchema>;

export const customerProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(7),
  address: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  debt_balance: z.number().nonnegative(),
  purchase_count: z.number().int().nonnegative(),
  sales: z.array(saleSummarySchema),
});

export type CustomerProfileContract = z.infer<typeof customerProfileSchema>;
