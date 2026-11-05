import { z } from 'zod';

/**
 * Validation schema for reminder thresholds and store mobile number.
 */
export const reminderSettingsSchema = z.object({
  reminder_days: z
    .number()
    .int('Reminder days must be an integer')
    .min(1, 'Reminder threshold must be at least 1 day'),
  admin_mobile: z
    .string()
    .trim()
    .min(7, 'Admin mobile number is required')
    .max(25, 'Admin mobile number is too long'),
  notification_channel: z.literal('SMS').default('SMS'),
});

export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;

export interface SystemSettingsDTO {
  id: string;
  reminder_days: number;
  admin_mobile: string;
  notification_channel: string;
  updated_at: string;
}

/**
 * Validation schema for a single variant minimum stock update.
 */
export const variantMinStockItemSchema = z.object({
  variant_id: z.string().min(1, 'Variant ID is required'),
  min_stock_level: z
    .number()
    .int('Minimum stock must be an integer')
    .min(0, 'Minimum stock cannot be negative'),
});

export const batchStockMinimumsSchema = z.object({
  items: z.array(variantMinStockItemSchema).min(1, 'At least one variant must be provided'),
});

export type BatchStockMinimumsInput = z.infer<typeof batchStockMinimumsSchema>;

/**
 * Password change validation schema.
 */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'New passwords do not match',
    path: ['confirm_password'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface SettingsActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}
