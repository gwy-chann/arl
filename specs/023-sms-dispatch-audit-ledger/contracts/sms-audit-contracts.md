# API & Service Contracts: SMS Dispatch & Delivery Audit Ledger

**Feature Key**: `ARL-26`  
**Feature Slug**: `023-sms-dispatch-audit-ledger`  

---

## 1. Zod Validation Schemas

```typescript
import { z } from 'zod';

export const smsRecipientTypeSchema = z.enum(['ADMIN', 'CUSTOMER']);
export const smsDispatchStatusSchema = z.enum(['SENT', 'FAILED', 'SKIPPED']);

export const createSmsDispatchLogSchema = z.object({
  saleId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  recipientMobile: z.string().min(1, 'Recipient mobile is required'),
  recipientType: smsRecipientTypeSchema,
  messageBody: z.string().min(1, 'Message body is required'),
  gatewayName: z.string().default('PHILSMS'),
  gatewayMessageId: z.string().nullable().optional(),
  status: smsDispatchStatusSchema,
  errorReason: z.string().nullable().optional(),
  latencyMs: z.number().int().nonnegative().nullable().optional(),
  dispatchedAt: z.string().datetime().optional(),
});
```

---

## 2. Service Interface Contracts

```typescript
export interface SmsAuditServiceContracts {
  recordSmsDispatchLog(
    input: CreateSmsDispatchLogInput,
    supabaseClient?: SupabaseClient | null
  ): Promise<SmsDispatchLogDTO>;

  getSmsLogsBySaleId(
    saleId: string,
    supabaseClient?: SupabaseClient | null
  ): Promise<SmsDispatchLogDTO[]>;

  getSmsLogsByCustomerId(
    customerId: string,
    supabaseClient?: SupabaseClient | null
  ): Promise<SmsDispatchLogDTO[]>;

  getAllSmsLogs(
    options?: { limit?: number; offset?: number; status?: SmsDispatchStatus },
    supabaseClient?: SupabaseClient | null
  ): Promise<SmsDispatchLogDTO[]>;
}
```
