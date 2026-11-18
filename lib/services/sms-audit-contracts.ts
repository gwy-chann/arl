import { z } from 'zod';

export type SmsRecipientType = 'ADMIN' | 'CUSTOMER';
export type SmsDispatchStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export const smsRecipientTypeSchema = z.enum(['ADMIN', 'CUSTOMER']);
export const smsDispatchStatusSchema = z.enum(['SENT', 'FAILED', 'SKIPPED']);

export const createSmsDispatchLogSchema = z.object({
  saleId: z.string().trim().nullable().optional(),
  customerId: z.string().trim().nullable().optional(),
  recipientMobile: z.string().min(1, 'Recipient mobile is required'),
  recipientType: smsRecipientTypeSchema,
  messageBody: z.string().min(1, 'Message body is required'),
  gatewayName: z.string().default('PHILSMS').optional(),
  gatewayMessageId: z.string().nullable().optional(),
  status: smsDispatchStatusSchema,
  errorReason: z.string().nullable().optional(),
  latencyMs: z.number().int().nonnegative().nullable().optional(),
  dispatchedAt: z.string().datetime().optional(),
});

export type CreateSmsDispatchLogInput = z.infer<typeof createSmsDispatchLogSchema>;

export interface SmsDispatchLogDTO {
  id: string;
  saleId: string | null;
  customerId: string | null;
  recipientMobile: string;
  recipientType: SmsRecipientType;
  messageBody: string;
  gatewayName: string;
  gatewayMessageId: string | null;
  status: SmsDispatchStatus;
  errorReason: string | null;
  latencyMs: number | null;
  dispatchedAt: string;
  createdAt: string;

  // DB-compatible snake_case aliases for direct query compatibility
  sale_id?: string | null;
  customer_id?: string | null;
  recipient_mobile?: string;
  recipient_type?: SmsRecipientType;
  message_body?: string;
  gateway_name?: string;
  gateway_message_id?: string | null;
  error_reason?: string | null;
  latency_ms?: number | null;
  dispatched_at?: string;
  created_at?: string;
}

export interface SmsAuditQueryOptions {
  limit?: number;
  offset?: number;
  status?: SmsDispatchStatus;
  recipientType?: SmsRecipientType;
}

/**
 * Normalizes raw Supabase database rows into typed DTOs with both camelCase
 * and snake_case properties.
 */
export function mapRowToSmsDispatchLogDTO(row: Record<string, unknown>): SmsDispatchLogDTO {
  const saleId = (row.sale_id ?? row.saleId ?? null) as string | null;
  const customerId = (row.customer_id ?? row.customerId ?? null) as string | null;
  const recipientMobile = String(row.recipient_mobile ?? row.recipientMobile ?? '');
  const recipientType = (row.recipient_type ?? row.recipientType ?? 'CUSTOMER') as SmsRecipientType;
  const messageBody = String(row.message_body ?? row.messageBody ?? '');
  const gatewayName = String(row.gateway_name ?? row.gatewayName ?? 'PHILSMS');
  const gatewayMessageId = (row.gateway_message_id ?? row.gatewayMessageId ?? null) as string | null;
  const status = (row.status ?? 'SENT') as SmsDispatchStatus;
  const errorReason = (row.error_reason ?? row.errorReason ?? null) as string | null;
  const latencyMs = row.latency_ms !== undefined && row.latency_ms !== null
    ? Number(row.latency_ms)
    : row.latencyMs !== undefined && row.latencyMs !== null
      ? Number(row.latencyMs)
      : null;
  const dispatchedAt = String(row.dispatched_at ?? row.dispatchedAt ?? new Date().toISOString());
  const createdAt = String(row.created_at ?? row.createdAt ?? dispatchedAt);

  return {
    id: String(row.id),
    saleId,
    customerId,
    recipientMobile,
    recipientType,
    messageBody,
    gatewayName,
    gatewayMessageId,
    status,
    errorReason,
    latencyMs,
    dispatchedAt,
    createdAt,
    // Database snake_case mirrors
    sale_id: saleId,
    customer_id: customerId,
    recipient_mobile: recipientMobile,
    recipient_type: recipientType,
    message_body: messageBody,
    gateway_name: gatewayName,
    gateway_message_id: gatewayMessageId,
    error_reason: errorReason,
    latency_ms: latencyMs,
    dispatched_at: dispatchedAt,
    created_at: createdAt,
  };
}
