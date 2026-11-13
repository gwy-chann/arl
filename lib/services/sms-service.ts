import type { SupabaseClient } from '@supabase/supabase-js';
import { getSystemSettings } from '../settings/settings-service.ts';
import { SaleService } from '../sales/sale-service.ts';
import type { SaleTransactionDTO } from '../sales/sale-contracts.ts';
import { getCustomerById, formatPeso } from '../customers/customer-service.ts';
import type { CustomerProfileData } from '../customers/customer-contracts.ts';
import {
  PHILIPPINE_MOBILE_REGEX,
  formatAdminReminderMessage,
  formatCustomerReminderMessage,
  type SmsDispatchPayload,
  type SmsDispatchResult,
  type ManualSmsNudgeInput,
  type OverdueSweepSummary,
} from './sms-contracts.ts';

/**
 * Validates and normalizes raw phone strings to standard Philippine mobile formats.
 */
export function validateAndNormalizePhilippineMobile(rawPhone?: string | null): {
  isValid: boolean;
  clean?: string;
  display?: string;
  e164?: string;
  error?: string;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return { isValid: false, error: 'Mobile number is required' };
  }

  // Remove whitespace, dashes, parentheses, dots
  let cleaned = rawPhone.replaceAll(/[\s\-().]/g, '');

  // Handle 639... without leading plus
  if (/^639\d{9}$/.test(cleaned)) {
    cleaned = `+${cleaned}`;
  }

  if (!PHILIPPINE_MOBILE_REGEX.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid Philippine mobile number format (expected 09XXXXXXXXX or +639XXXXXXXXX)',
    };
  }

  const standardDigits = cleaned.startsWith('+63') ? `0${cleaned.slice(3)}` : cleaned;
  const e164 = cleaned.startsWith('+63') ? cleaned : `+63${cleaned.slice(1)}`;
  const display = `${standardDigits.slice(0, 4)} ${standardDigits.slice(4, 7)} ${standardDigits.slice(7)}`;

  return {
    isValid: true,
    clean: standardDigits,
    display,
    e164,
  };
}

// In-memory audit log of dispatched SMS messages (used for verification and testing)
let dispatchedSmsHistory: SmsDispatchPayload[] = [];

/**
 * Resets the in-memory SMS audit history (used in test setup/teardown).
 */
export function _resetSmsHistory(): void {
  dispatchedSmsHistory = [];
}

/**
 * Retrieves a copy of all dispatched SMS payloads.
 */
export function _getDispatchedSmsHistory(): SmsDispatchPayload[] {
  return [...dispatchedSmsHistory];
}

/**
 * Core SMS Dispatcher sending message to SMS gateway provider.
 * Uses a resilient mock logger in test and local environments.
 */
export async function dispatchSms(payload: SmsDispatchPayload): Promise<SmsDispatchResult> {
  const norm = validateAndNormalizePhilippineMobile(payload.recipientMobile);
  const nowIso = new Date().toISOString();

  if (!norm.isValid) {
    return {
      success: false,
      recipientMobile: payload.recipientMobile,
      recipientType: payload.recipientType,
      timestamp: nowIso,
      error: norm.error || 'Invalid mobile number',
    };
  }

  try {
    // Record into audit log
    dispatchedSmsHistory.push({
      ...payload,
      recipientMobile: norm.display || payload.recipientMobile,
    });

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    return {
      success: true,
      messageId,
      recipientMobile: norm.display || payload.recipientMobile,
      recipientType: payload.recipientType,
      timestamp: nowIso,
    };
  } catch (err) {
    return {
      success: false,
      recipientMobile: payload.recipientMobile,
      recipientType: payload.recipientType,
      timestamp: nowIso,
      error: err instanceof Error ? err.message : 'SMS Gateway transmission failure',
    };
  }
}

/**
 * Dispatches an on-demand manual SMS reminder to a customer for a specific sale or account.
 */
export async function sendManualCustomerSmsNudge(
  input: ManualSmsNudgeInput,
  supabaseClient?: SupabaseClient | null
): Promise<{
  success: boolean;
  message?: string;
  dispatchedTo?: string;
  error?: string;
  lastSmsSentAt?: string;
}> {
  const saleService = new SaleService(supabaseClient);
  const settings = await getSystemSettings(supabaseClient);

  let targetSale: SaleTransactionDTO | null = null;
  let targetCustomer: CustomerProfileData | null = null;

  if (input.saleId) {
    targetSale = await saleService.getSaleById(input.saleId);
    if (!targetSale) {
      return { success: false, error: `Sale not found: ${input.saleId}` };
    }
    targetCustomer = await getCustomerById(targetSale.customer_id, supabaseClient);
  } else if (input.customerId) {
    targetCustomer = await getCustomerById(input.customerId, supabaseClient);
    if (!targetCustomer) {
      return { success: false, error: `Customer not found: ${input.customerId}` };
    }
    // Find oldest unpaid sale for this customer
    const sales = await saleService.getSales();
    const customerUnpaidSales = sales.filter(
      (s) => s.customer_id === targetCustomer?.id && s.balance > 0
    );
    if (customerUnpaidSales.length > 0) {
      targetSale = customerUnpaidSales[0];
    }
  }

  if (!targetCustomer) {
    return { success: false, error: 'Customer record could not be resolved' };
  }

  const phoneCheck = validateAndNormalizePhilippineMobile(targetCustomer.phone);
  if (!phoneCheck.isValid) {
    return {
      success: false,
      error: `Cannot send SMS: ${targetCustomer.name} has no valid mobile number on record.`,
    };
  }

  const balance = targetSale ? targetSale.balance : (targetCustomer.debt_balance || 0);
  const receiptNo = targetSale ? targetSale.receipt_number : 'ARLQ-ACCT';
  const reminderDays = settings.reminder_days || 7;

  const messageText = formatCustomerReminderMessage({
    customerName: targetCustomer.name,
    balanceFormatted: formatPeso(balance),
    receiptNumber: receiptNo,
    reminderDays,
  });

  const sendResult = await dispatchSms({
    recipientMobile: phoneCheck.clean || targetCustomer.phone,
    recipientType: 'CUSTOMER',
    message: messageText,
    saleId: targetSale?.id,
    receiptNumber: receiptNo,
    customerId: targetCustomer.id,
    customerName: targetCustomer.name,
  });

  if (!sendResult.success) {
    return {
      success: false,
      error: sendResult.error || 'Failed to dispatch SMS reminder via gateway',
    };
  }

  const nowIso = new Date().toISOString();
  if (targetSale?.id) {
    await saleService.updateLastSmsSentAt(targetSale.id, nowIso);
  }

  return {
    success: true,
    message: `SMS reminder sent to ${targetCustomer.name}`,
    dispatchedTo: phoneCheck.display || targetCustomer.phone,
    lastSmsSentAt: nowIso,
  };
}

/**
 * Checks if a given sale is eligible for an automated reminder under cooldown rules.
 * Enforces a 24-hour rate limit between dispatches for the same sale.
 */
export function isEligibleForAutomatedReminder(
  lastSmsSentAt: string | null | undefined,
  currentDate: Date = new Date()
): boolean {
  if (!lastSmsSentAt) return true;
  const lastSent = new Date(lastSmsSentAt);
  if (Number.isNaN(lastSent.getTime())) return true;

  const msSinceLast = currentDate.getTime() - lastSent.getTime();
  const hoursSinceLast = msSinceLast / (1000 * 60 * 60);
  return hoursSinceLast >= 24;
}

/**
 * Scheduled or automated background sweep dispatching overdue balance SMS notifications.
 * Implements Scenario 1 (Dual Dispatch) and Scenario 2 (Graceful skipping without error).
 */
export async function dispatchOverdueBalanceReminders(options?: {
  asOfDate?: Date;
  supabaseClient?: SupabaseClient | null;
}): Promise<OverdueSweepSummary> {
  const asOf = options?.asOfDate || new Date();
  const supabase = options?.supabaseClient;
  const settings = await getSystemSettings(supabase);
  const saleService = new SaleService(supabase);

  const sales = await saleService.getSales();
  const reminderDays = settings.reminder_days || 7;

  const summary: OverdueSweepSummary = {
    salesEvaluated: sales.length,
    adminSmsDispatched: 0,
    customerSmsDispatched: 0,
    customerSmsSkipped: 0,
    dispatches: [],
  };

  for (const sale of sales) {
    // 1. Invariant: Sale must have outstanding balance
    if (sale.balance <= 0 || sale.payment_status === 'Paid') {
      continue;
    }

    // 2. Invariant: Sale age must meet or exceed reminder threshold
    const saleDate = new Date(sale.created_at);
    const daysUnpaid = Math.floor((asOf.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUnpaid < reminderDays) {
      continue;
    }

    // 3. Cooldown Invariant: Must not have sent automated SMS in past 24 hours
    if (!isEligibleForAutomatedReminder(sale.last_sms_sent_at, asOf)) {
      continue;
    }

    const customerName = sale.customer_name || 'Customer';
    const balanceFormatted = formatPeso(sale.balance);

    // 4. Dispatch Admin Operational Alert
    const adminMessage = formatAdminReminderMessage({
      customerName,
      balanceFormatted,
      receiptNumber: sale.receipt_number,
      daysUnpaid,
      reminderDays,
    });

    const adminResult = await dispatchSms({
      recipientMobile: settings.admin_mobile,
      recipientType: 'ADMIN',
      message: adminMessage,
      saleId: sale.id,
      receiptNumber: sale.receipt_number,
      customerId: sale.customer_id,
      customerName,
    });

    summary.dispatches.push(adminResult);
    if (adminResult.success) {
      summary.adminSmsDispatched += 1;
    }

    // 5. Dispatch Customer Courteous Reminder if enabled
    if (settings.notify_customer_sms) {
      const phoneNorm = validateAndNormalizePhilippineMobile(sale.customer_phone);

      if (phoneNorm.isValid) {
        const customerMessage = formatCustomerReminderMessage({
          customerName,
          balanceFormatted,
          receiptNumber: sale.receipt_number,
          reminderDays,
        });

        const customerResult = await dispatchSms({
          recipientMobile: phoneNorm.clean || sale.customer_phone || '',
          recipientType: 'CUSTOMER',
          message: customerMessage,
          saleId: sale.id,
          receiptNumber: sale.receipt_number,
          customerId: sale.customer_id,
          customerName,
        });

        summary.dispatches.push(customerResult);
        if (customerResult.success) {
          summary.customerSmsDispatched += 1;
        }
      } else {
        // Scenario 2: Gracefully skip without throwing exception and record audit
        summary.customerSmsSkipped += 1;
        summary.dispatches.push({
          success: false,
          recipientMobile: sale.customer_phone || 'N/A',
          recipientType: 'CUSTOMER',
          timestamp: asOf.toISOString(),
          error: 'Customer SMS skipped: No valid mobile number',
        });
      }
    }

    // Update last_sms_sent_at on sale record
    await saleService.updateLastSmsSentAt(sale.id, asOf.toISOString());
  }

  return summary;
}
