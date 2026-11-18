# Implementation Tasks: SMS Dispatch & Delivery Audit Ledger with Message ID Tracking

**Feature Key**: `ARL-26`  
**Feature Slug**: `023-sms-dispatch-audit-ledger`  

---

## Task Overview & Dependencies

```mermaid
flowchart TD
    T1[Task 1: Supabase DDL Migration\nsms_dispatch_logs table, indexes, trigger] --> T2[Task 2: Service Contracts & Schemas\nlib/services/sms-audit-contracts.ts]
    T2 --> T3[Task 3: SMS Audit Service Repository\nlib/services/sms-audit-service.ts]
    T3 --> T4[Task 4: SMS Dispatcher Integration\nlib/services/sms-service.ts]
    T4 --> T5[Task 5: Comprehensive Unit Tests\ntests/unit/sms-audit-service.test.ts]
    T5 --> T6[Task 6: Convergence Verification & Typecheck]
```

---

## Phase 1: Database & Schemas (Unit 3)

- [x] `TASK-1`: Create database migration script `supabase/migrations/20261118000000_sms_dispatch_logs_ledger.sql`
  - [x] Define `public.sms_dispatch_logs` table with columns: `id`, `sale_id`, `customer_id`, `recipient_mobile`, `recipient_type`, `message_body`, `gateway_name`, `gateway_message_id`, `status`, `error_reason`, `latency_ms`, `dispatched_at`, `created_at`
  - [x] Add check constraints: `recipient_type IN ('ADMIN', 'CUSTOMER')`, `status IN ('SENT', 'FAILED', 'SKIPPED')`
  - [x] Add foreign keys `ON DELETE SET NULL` for `sale_id` and `customer_id`
  - [x] Create indexes for `sale_id`, `customer_id`, `(status, dispatched_at DESC)`, and `gateway_message_id`
  - [x] Configure RLS policies allowing authenticated users `SELECT` and `INSERT`
  - [x] Create PostgreSQL trigger `trg_prevent_sms_dispatch_logs_mutation` preventing `UPDATE` and `DELETE`

## Phase 2: Domain Contracts & Services (Unit 4)

- [x] `TASK-2`: Create `lib/services/sms-audit-contracts.ts`
  - [x] Export `SmsRecipientType` ('ADMIN' | 'CUSTOMER') and `SmsDispatchStatus` ('SENT' | 'FAILED' | 'SKIPPED')
  - [x] Export `SmsDispatchLogDTO` and `CreateSmsDispatchLogInput`
  - [x] Define Zod schemas `createSmsDispatchLogSchema`, `smsRecipientTypeSchema`, `smsDispatchStatusSchema`
- [x] `TASK-3`: Implement `lib/services/sms-audit-service.ts`
  - [x] Implement `recordSmsDispatchLog(input, supabaseClient?)`
  - [x] Implement `getSmsLogsBySaleId(saleId, supabaseClient?)`
  - [x] Implement `getSmsLogsByCustomerId(customerId, supabaseClient?)`
  - [x] Implement `getAllSmsLogs(options?, supabaseClient?)`
  - [x] Provide in-memory storage fallback for local development and mock testing environments
  - [x] Provide helper `_resetSmsAuditLogs()` for test harness isolation
- [x] `TASK-4`: Integrate audit logging into `lib/services/sms-service.ts`
  - [x] Update `dispatchSms` to record `SENT` or `FAILED` dispatches with `gateway_message_id`, `latency_ms`, `error_reason`
  - [x] Record `SKIPPED` dispatches when phone number is missing, notification disabled, or 24h cooldown active
  - [x] Ensure audit logging is non-blocking to prevent UI/POS stalls

## Phase 3: Automated Testing & Verification (Unit 4 & 6)

- [x] `TASK-5`: Create unit test suite `tests/unit/sms-audit-service.test.ts`
  - [x] Test recording successful PhilSMS dispatch (`SENT`, `gateway_message_id`, `latency_ms`)
  - [x] Test recording gateway error or network failure (`FAILED`, `error_reason`, null `gateway_message_id`)
  - [x] Test recording skipped dispatch (`SKIPPED`, `error_reason`)
  - [x] Test querying audit records by `saleId` and verifying descending sort by `dispatched_at`
  - [x] Test querying audit records by `customerId`
  - [x] Test input schema validation rejecting invalid recipient types or statuses
  - [x] Test integration with `dispatchSms` and `dispatchOverdueBalanceReminders`
- [x] `TASK-6`: Convergence & Full Suite Validation
  - [x] Run full test suite `npm test`
  - [x] Run TypeScript typecheck `npm run typecheck`
  - [x] Run linter `npm run lint`
  - [x] Update documentation and task tracking checklists
