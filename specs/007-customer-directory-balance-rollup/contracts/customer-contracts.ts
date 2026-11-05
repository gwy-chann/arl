import { z } from 'zod';

export const customerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 characters')
    .max(25, 'Phone number cannot exceed 25 characters'),
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters')
    .default(''),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export interface CustomerDTO {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithRollupDTO extends CustomerDTO {
  purchase_count: number;
  debt_balance: number;
}

export interface CustomerActionResult {
  success: boolean;
  customer?: CustomerDTO;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
