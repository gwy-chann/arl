import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSystemSettings } from '../settings/settings-service.ts';
import { SaleService } from '../sales/sale-service.ts';
import { formatPeso } from '../customers/customer-service.ts';
import {
  formatAdminReminderMessage,
  formatCustomerReminderMessage,
} from './sms-contracts.ts';
import {
  validateAndNormalizePhilippineMobile,
  isEligibleForAutomatedReminder,
  dispatchSms,
} from './sms-service.ts';
import { recordSmsDispatchLog } from './sms-audit-service.ts';

export interface CronSweepSummary {
  salesEvaluated: number;
  eligibleOverdue: number;
  cooldownSuppressed: number;
  adminSmsDispatched: number;
  customerSmsDispatched: number;
  customerSmsSkipped: number;
  errors: number;
  durationMs: number;
}

export interface CronRouteResponse {
  success: boolean;
  timestamp: string;
  summary?: CronSweepSummary;
  error?: string;
}

export interface OverdueSweepOptions {
  asOfDate?: Date;
  throttleMs?: number;
  supabaseClient?: SupabaseClient | null;
}

/**
 * Validates the Authorization header using constant-time comparison against CRON_SECRET.
 * Rejects requests if CRON_SECRET is not configured or if token does not match.
 */
export function isAuthorizedCronRequest(
  authHeader: string | null,
  cronSecret?: string
): boolean {
  const secret = cronSecret !== undefined ? cronSecret : process.env.CRON_SECRET;
  if (!secret || !authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);

  if (tokenBuffer.length !== secretBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Orchestrates the scheduled automated overdue receivables sweep.
 * Evaluates delinquent sales, enforces 24-hour cooldowns, applies pacing,
 * dispatches dual notifications (admin + customer), updates timestamps,
 * isolates failures per sale, and aggregates batch metrics.
 */
export async function executeOverdueSmsSweep(
  options?: OverdueSweepOptions
): Promise<CronSweepSummary> {
  const startTime = Date.now();
  const asOf = options?.asOfDate || new Date();
  const throttleMs = options?.throttleMs !== undefined ? options.throttleMs : 150;
  const supabase = options?.supabaseClient;

  const settings = await getSystemSettings(supabase);
  const saleService = new SaleService(supabase);
  const sales = await saleService.getSales();
  const reminderDays = settings.reminder_days || 7;

  const summary: CronSweepSummary = {
    salesEvaluated: sales.length,
    eligibleOverdue: 0,
    cooldownSuppressed: 0,
    adminSmsDispatched: 0,
    customerSmsDispatched: 0,
    customerSmsSkipped: 0,
    errors: 0,
    durationMs: 0,
  };

  for (const sale of sales) {
    // 1. Invariant: Sale must have outstanding balance and not be marked paid
    const isPaid =
      sale.balance <= 0 ||
      sale.payment_status?.toUpperCase() === 'PAID' ||
      sale.payment_status === 'Paid';
    if (isPaid) {
      continue;
    }

    // 2. Invariant: Sale age must meet or exceed overdue reminder threshold
    const saleDate = new Date(sale.created_at);
    const daysUnpaid = Math.floor((asOf.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUnpaid < reminderDays) {
      continue;
    }

    // This sale qualifies as eligible overdue
    summary.eligibleOverdue += 1;

    // 3. Cooldown Invariant: 24-Hour Cooldown Filter
    if (!isEligibleForAutomatedReminder(sale.last_sms_sent_at, asOf)) {
      summary.cooldownSuppressed += 1;
      await recordSmsDispatchLog(
        {
          saleId: sale.id,
          customerId: sale.customer_id,
          recipientMobile: sale.customer_phone || settings.admin_mobile || '0917 555 0142',
          recipientType: 'CUSTOMER',
          messageBody: `[SKIPPED] Overdue balance reminder for receipt ${sale.receipt_number}`,
          gatewayName: 'PHILSMS',
          gatewayMessageId: null,
          status: 'SKIPPED',
          errorReason: 'Dispatched within last 24h cooldown',
          latencyMs: 0,
          dispatchedAt: asOf.toISOString(),
        },
        supabase
      ).catch((err) => {
        console.error('[executeOverdueSmsSweep] Cooldown audit log error:', err);
      });
      continue;
    }

    const customerName = sale.customer_name || 'Customer';
    const balanceFormatted = formatPeso(sale.balance);

    // 4. Paced Dispatch: Process sale with error isolation
    try {
      // 4a. Admin Operational Alert
      const adminMessage = formatAdminReminderMessage({
        customerName,
        balanceFormatted,
        receiptNumber: sale.receipt_number,
        daysUnpaid,
        reminderDays,
      });

      const adminResult = await dispatchSms(
        {
          recipientMobile: settings.admin_mobile,
          recipientType: 'ADMIN',
          message: adminMessage,
          saleId: sale.id,
          receiptNumber: sale.receipt_number,
          customerId: sale.customer_id,
          customerName,
        },
        supabase
      );

      if (adminResult.success) {
        summary.adminSmsDispatched += 1;

        // Throttle delay between sends
        if (throttleMs > 0) {
          await delay(throttleMs);
        }

        // 4b. Customer Courteous Reminder (if enabled in settings)
        if (settings.notify_customer_sms) {
          const phoneNorm = validateAndNormalizePhilippineMobile(sale.customer_phone);

          if (phoneNorm.isValid) {
            const customerMessage = formatCustomerReminderMessage({
              customerName,
              balanceFormatted,
              receiptNumber: sale.receipt_number,
              reminderDays,
            });

            const customerResult = await dispatchSms(
              {
                recipientMobile: phoneNorm.clean || sale.customer_phone || '',
                recipientType: 'CUSTOMER',
                message: customerMessage,
                saleId: sale.id,
                receiptNumber: sale.receipt_number,
                customerId: sale.customer_id,
                customerName,
              },
              supabase
            );

            if (customerResult.success) {
              summary.customerSmsDispatched += 1;
            } else {
              summary.errors += 1;
            }

            if (throttleMs > 0) {
              await delay(throttleMs);
            }
          } else {
            // Customer phone missing or invalid
            summary.customerSmsSkipped += 1;
            await recordSmsDispatchLog(
              {
                saleId: sale.id,
                customerId: sale.customer_id,
                recipientMobile: sale.customer_phone || 'N/A',
                recipientType: 'CUSTOMER',
                messageBody: formatCustomerReminderMessage({
                  customerName,
                  balanceFormatted,
                  receiptNumber: sale.receipt_number,
                  reminderDays,
                }),
                gatewayName: 'PHILSMS',
                gatewayMessageId: null,
                status: 'SKIPPED',
                errorReason: 'Customer phone number missing',
                latencyMs: 0,
                dispatchedAt: asOf.toISOString(),
              },
              supabase
            ).catch((err) => {
              console.error('[executeOverdueSmsSweep] Customer phone missing audit log error:', err);
            });
          }
        } else {
          // Customer SMS disabled in System Settings
          summary.customerSmsSkipped += 1;
          await recordSmsDispatchLog(
            {
              saleId: sale.id,
              customerId: sale.customer_id,
              recipientMobile: sale.customer_phone || settings.admin_mobile || '0917 555 0142',
              recipientType: 'CUSTOMER',
              messageBody: formatCustomerReminderMessage({
                customerName,
                balanceFormatted,
                receiptNumber: sale.receipt_number,
                reminderDays,
              }),
              gatewayName: 'PHILSMS',
              gatewayMessageId: null,
              status: 'SKIPPED',
              errorReason: 'Customer notification disabled in settings',
              latencyMs: 0,
              dispatchedAt: asOf.toISOString(),
            },
            supabase
          ).catch((err) => {
            console.error('[executeOverdueSmsSweep] Customer disabled audit log error:', err);
          });
        }

        // 4c. Update timestamp on sale record
        await saleService.updateLastSmsSentAt(sale.id, asOf.toISOString());
      } else {
        // Admin dispatch failed on gateway error
        summary.errors += 1;
      }
    } catch (itemError) {
      console.error(`[executeOverdueSmsSweep] Error processing sale ${sale.id}:`, itemError);
      summary.errors += 1;
    }
  }

  summary.durationMs = Date.now() - startTime;
  return summary;
}
