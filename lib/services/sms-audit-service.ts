import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type CreateSmsDispatchLogInput,
  type SmsDispatchLogDTO,
  type SmsAuditQueryOptions,
  createSmsDispatchLogSchema,
  mapRowToSmsDispatchLogDTO,
} from './sms-audit-contracts.ts';

// In-memory audit log storage for test isolation and offline fallback
let inMemorySmsAuditLogs: SmsDispatchLogDTO[] = [];

/**
 * Resets the in-memory SMS audit log store (used for test isolation).
 */
export function _resetSmsAuditLogs(): void {
  inMemorySmsAuditLogs = [];
}

/**
 * Retrieves a direct clone of in-memory SMS audit logs.
 */
export function _getInMemorySmsAuditLogs(): SmsDispatchLogDTO[] {
  return [...inMemorySmsAuditLogs];
}

/**
 * Records an outbound SMS dispatch attempt into the immutable audit ledger.
 * Automatically persists to Supabase `sms_dispatch_logs` if client is available,
 * falling back to in-memory store in local/test environments.
 */
export async function recordSmsDispatchLog(
  input: CreateSmsDispatchLogInput,
  supabaseClient?: SupabaseClient | null
): Promise<SmsDispatchLogDTO> {
  // 1. Validate input against schema
  const validated = createSmsDispatchLogSchema.parse(input);

  const nowIso = validated.dispatchedAt || new Date().toISOString();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const dto: SmsDispatchLogDTO = {
    id,
    saleId: validated.saleId ?? null,
    customerId: validated.customerId ?? null,
    recipientMobile: validated.recipientMobile,
    recipientType: validated.recipientType,
    messageBody: validated.messageBody,
    gatewayName: validated.gatewayName || 'PHILSMS',
    gatewayMessageId: validated.gatewayMessageId ?? null,
    status: validated.status,
    errorReason: validated.errorReason ?? null,
    latencyMs: validated.latencyMs ?? null,
    dispatchedAt: nowIso,
    createdAt: nowIso,
    // Database snake_case aliases
    sale_id: validated.saleId ?? null,
    customer_id: validated.customerId ?? null,
    recipient_mobile: validated.recipientMobile,
    recipient_type: validated.recipientType,
    message_body: validated.messageBody,
    gateway_name: validated.gatewayName || 'PHILSMS',
    gateway_message_id: validated.gatewayMessageId ?? null,
    error_reason: validated.errorReason ?? null,
    latency_ms: validated.latencyMs ?? null,
    dispatched_at: nowIso,
    created_at: nowIso,
  };

  // Always mirror in-memory for testing / local introspection
  inMemorySmsAuditLogs.unshift(dto);

  if (supabaseClient) {
    try {
      const dbRow = {
        id: dto.id,
        sale_id: dto.saleId,
        customer_id: dto.customerId,
        recipient_mobile: dto.recipientMobile,
        recipient_type: dto.recipientType,
        message_body: dto.messageBody,
        gateway_name: dto.gatewayName,
        gateway_message_id: dto.gatewayMessageId,
        status: dto.status,
        error_reason: dto.errorReason,
        latency_ms: dto.latencyMs,
        dispatched_at: dto.dispatchedAt,
      };

      const { data, error } = await supabaseClient
        .from('sms_dispatch_logs')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error('[SmsAuditService] Failed to insert log to Supabase:', error.message);
        return dto;
      }

      if (data) {
        return mapRowToSmsDispatchLogDTO(data as Record<string, unknown>);
      }
    } catch (err) {
      console.error('[SmsAuditService] Unexpected exception writing log to Supabase:', err);
      return dto;
    }
  }

  return dto;
}

/**
 * Retrieves audit logs associated with a specific sale ID, ordered by dispatched_at descending.
 */
export async function getSmsLogsBySaleId(
  saleId: string,
  supabaseClient?: SupabaseClient | null
): Promise<SmsDispatchLogDTO[]> {
  if (!saleId) return [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('sms_dispatch_logs')
        .select('*')
        .eq('sale_id', saleId)
        .order('dispatched_at', { ascending: false });

      if (error) {
        console.error(`[SmsAuditService] Error fetching logs for sale ${saleId}:`, error.message);
      } else if (data) {
        return (data as Record<string, unknown>[]).map(mapRowToSmsDispatchLogDTO);
      }
    } catch (err) {
      console.error(`[SmsAuditService] Exception querying logs for sale ${saleId}:`, err);
    }
  }

  return inMemorySmsAuditLogs
    .filter((log) => log.saleId === saleId || log.sale_id === saleId)
    .sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());
}

/**
 * Retrieves audit logs associated with a specific customer ID, ordered by dispatched_at descending.
 */
export async function getSmsLogsByCustomerId(
  customerId: string,
  supabaseClient?: SupabaseClient | null
): Promise<SmsDispatchLogDTO[]> {
  if (!customerId) return [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('sms_dispatch_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('dispatched_at', { ascending: false });

      if (error) {
        console.error(`[SmsAuditService] Error fetching logs for customer ${customerId}:`, error.message);
      } else if (data) {
        return (data as Record<string, unknown>[]).map(mapRowToSmsDispatchLogDTO);
      }
    } catch (err) {
      console.error(`[SmsAuditService] Exception querying logs for customer ${customerId}:`, err);
    }
  }

  return inMemorySmsAuditLogs
    .filter((log) => log.customerId === customerId || log.customer_id === customerId)
    .sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());
}

/**
 * Retrieves audit logs with optional filtering and pagination.
 */
export async function getAllSmsLogs(
  options?: SmsAuditQueryOptions,
  supabaseClient?: SupabaseClient | null
): Promise<SmsDispatchLogDTO[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  if (supabaseClient) {
    try {
      let query = supabaseClient
        .from('sms_dispatch_logs')
        .select('*')
        .order('dispatched_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.recipientType) {
        query = query.eq('recipient_type', options.recipientType);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[SmsAuditService] Error fetching all logs:', error.message);
      } else if (data) {
        return (data as Record<string, unknown>[]).map(mapRowToSmsDispatchLogDTO);
      }
    } catch (err) {
      console.error('[SmsAuditService] Exception querying all logs:', err);
    }
  }

  let filtered = [...inMemorySmsAuditLogs];
  if (options?.status) {
    filtered = filtered.filter((l) => l.status === options.status);
  }
  if (options?.recipientType) {
    filtered = filtered.filter((l) => l.recipientType === options.recipientType);
  }

  return filtered
    .sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime())
    .slice(offset, offset + limit);
}
