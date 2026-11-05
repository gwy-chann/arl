import { z } from 'zod';

export const debtStatusSchema = z.enum(['Overdue', 'Not yet due']);
export type DebtStatusContract = z.infer<typeof debtStatusSchema>;

export const customerUtangRowSchema = z.object({
  customer_id: z.string().min(1),
  customer_name: z.string().min(1),
  phone: z.string(),
  oldest_sale_id: z.string().min(1),
  oldest_receipt_number: z.string().min(1),
  oldest_sale_date: z.string(),
  days_outstanding: z.number().int().nonnegative(),
  total_balance: z.number().positive(),
  is_overdue: z.boolean(),
  status: debtStatusSchema,
});

export type CustomerUtangRowContract = z.infer<typeof customerUtangRowSchema>;

export const customerUtangSummarySchema = z.object({
  rows: z.array(customerUtangRowSchema),
  total_owed: z.number().nonnegative(),
  total_debtors: z.number().int().nonnegative(),
  overdue_owed: z.number().nonnegative(),
  overdue_debtors: z.number().int().nonnegative(),
  reminder_days: z.number().int().positive(),
  admin_mobile: z.string().min(1),
});

export type CustomerUtangSummaryContract = z.infer<typeof customerUtangSummarySchema>;
