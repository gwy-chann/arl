import { z } from 'zod';

/**
 * Validates Philippine standard mobile numbers:
 * Starts with 09 or +639 followed by 9 digits (total 11 digits for 09..., 13 chars for +639...).
 */
export const PHILIPPINE_MOBILE_REGEX = /^(09|\+639)\d{9}$/;

export const philippineMobileSchema = z
  .string()
  .trim()
  .transform((val) => val.replaceAll(/[\s\-()]/g, ''))
  .refine((val) => PHILIPPINE_MOBILE_REGEX.test(val), {
    message: 'Mobile number must be a valid Philippine number (e.g., 0917 123 4567 or +639171234567)',
  });

/**
 * Extended Reminder Settings Schema supporting customer toggle.
 */
export const extendedReminderSettingsSchema = z.object({
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
  notify_customer_sms: z.boolean().default(false),
  customer_sms_template: z.string().nullable().optional(),
});

export type ExtendedReminderSettingsInput = z.infer<typeof extendedReminderSettingsSchema>;

/**
 * Validation schema for on-demand manual customer SMS reminder dispatch.
 */
export const manualSmsNudgeSchema = z
  .object({
    saleId: z.string().trim().min(1).optional(),
    customerId: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.saleId || data.customerId), {
    message: 'Either saleId or customerId must be provided to send an SMS reminder',
  });

export type ManualSmsNudgeInput = z.infer<typeof manualSmsNudgeSchema>;

/**
 * Generates the operational alert message for the store administrator.
 */
export function formatAdminReminderMessage(params: {
  customerName: string;
  balanceFormatted: string;
  receiptNumber: string;
  daysUnpaid: number;
  reminderDays: number;
}): string {
  return `ARLQ Alert: ${params.customerName} still owes ${params.balanceFormatted} for receipt ${params.receiptNumber}. Unpaid for ${params.daysUnpaid} days (limit: ${params.reminderDays} days). Reminders stop once marked Paid.`;
}

/**
 * Generates the courteous, branded reminder message for the indebted customer.
 */
export function formatCustomerReminderMessage(params: {
  customerName: string;
  balanceFormatted: string;
  receiptNumber: string;
  reminderDays: number;
}): string {
  return `ARLQ Condiments: Good day, ${params.customerName}! Friendly reminder that receipt ${params.receiptNumber} has an outstanding balance of ${params.balanceFormatted} (due after ${params.reminderDays} days). Kindly settle at your earliest convenience. Thank you for your continued business!`;
}

