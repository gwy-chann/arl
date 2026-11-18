# Technical Research & Architecture Decisions: SMS Dispatch & Delivery Audit Ledger

**Feature Key**: `ARL-26`  
**Feature Slug**: `023-sms-dispatch-audit-ledger`  

---

## 1. Architectural Strategy & Design Patterns

### 1.1 Asynchronous Fire-and-Forget vs. Await Logging
- **Decision**: In primary user-facing dispatch paths (e.g. checkout SMS notification or manual nudge), audit logging is executed asynchronously (`recordSmsDispatchLog(...).catch(console.error)`), or awaited when internal caller context requires deterministic auditing (such as background cron sweeps or tests).
- **Rationale**: External network and database delays on logging must never hold up customer checkout or cash drawer transactions.

### 1.2 Immutability Strategy in PostgreSQL
- **Decision**: Combine Row Level Security (RLS) policies with a PostgreSQL database trigger (`trg_prevent_sms_dispatch_logs_mutation`).
- **Rationale**:
  - RLS policies for `authenticated` roles only grant `SELECT` and `INSERT`.
  - The trigger explicitly prevents any `UPDATE` or `DELETE` regardless of client roles or bypassed RLS:
    ```sql
    CREATE OR REPLACE FUNCTION public.prevent_sms_dispatch_logs_mutation()
    RETURNS TRIGGER AS $$
    BEGIN
        RAISE EXCEPTION 'sms_dispatch_logs is an immutable audit ledger. UPDATE and DELETE operations are strictly prohibited.';
    END;
    $$ LANGUAGE plpgsql;
    ```
  - This satisfies legal compliance requirements for financial debt collection notices in the Philippines.

### 1.3 Schema Relationships & Cascading Deletions
- **Decision**: Foreign keys to `sales` and `customers` use `ON DELETE SET NULL`.
- **Rationale**: If a test sale is voided or archived, the dispatch audit trail must **remain preserved** for telecom audit and billing verification, with the referenced `sale_id` / `customer_id` set to null while retaining recipient phone and message text.

### 1.4 Gateway UID & Latency Extraction
- **Decision**: In `sms-resilience.ts` and `philsms-adapter.ts`, `SafeSmsDispatchResult` already returns `durationMs`, `messageId`, and `errorCode`. We pass these directly to `recordSmsDispatchLog`.
- **Status Mapping**:
  - `safeResult.success === true` ➔ `status = 'SENT'`
  - `safeResult.success === false` ➔ `status = 'FAILED'`
  - Invalid recipient / missing phone prior to dispatch ➔ `status = 'SKIPPED'`

---

## 2. Technology Stack & Dependencies

- **Database**: PostgreSQL 15+ (Supabase)
- **Runtime**: Node.js 20+ (Next.js App Router)
- **Validation**: Zod 3.x
- **Testing**: Node Test Runner (`node:test`) + `assert/strict`
- **SMS Gateway**: PhilSMS REST API via `philsms-adapter.ts` and `sms-resilience.ts`
