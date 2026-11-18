# Implementation Plan: SMS Dispatch & Delivery Audit Ledger with Message ID Tracking

**Feature Key**: `ARL-26`  
**Feature Slug**: `023-sms-dispatch-audit-ledger`  
**Status**: In Progress  

---

## 1. Technical Context & Boundary Mapping

- **Database Layer**:
  - `supabase/migrations/20261118000000_sms_dispatch_logs_ledger.sql`: Creates `sms_dispatch_logs` table, indexes, RLS policies, and immutability trigger.
- **Contracts Layer**:
  - `lib/services/sms-audit-contracts.ts`: Zod schemas, TypeScript types (`SmsDispatchLogDTO`, `CreateSmsDispatchLogInput`), and status enums (`SmsRecipientType`, `SmsDispatchStatus`).
- **Service Layer**:
  - `lib/services/sms-audit-service.ts`: Implements `recordSmsDispatchLog`, `getSmsLogsBySaleId`, `getSmsLogsByCustomerId`, and in-memory mock repository for non-database test harnesses.
- **Integration Layer**:
  - `lib/services/sms-service.ts`: Wire up `recordSmsDispatchLog` into `dispatchSms`, `sendManualCustomerSmsNudge`, and `dispatchOverdueBalanceReminders`.
- **Test Layer**:
  - `tests/unit/sms-audit-service.test.ts`: Test coverage for log insertion, querying by sale/customer, status mapping, latency measurement, and skipped dispatch logging.

---

## 2. Architectural Decision Records (ADRs)

1. **Immutable Audit Ledger**:
   - Outbound SMS records represent financial collection actions and legal notices.
   - Modifying or deleting audit rows is strictly forbidden via PostgreSQL trigger and RLS restriction.
2. **Non-Blocking Dispatch Logging**:
   - Dispatches log asynchronously without waiting unless requested by caller, preventing any degradation in checkout response times.
3. **Foreign Key Strategy**:
   - `ON DELETE SET NULL` on `sale_id` and `customer_id` ensures logs remain intact even if parent entities are deleted or cleaned up.

---

## 3. Implementation Phases

- **Phase 1: Database Migration**: Write DDL migration script with table, foreign keys, indexes, and immutability trigger.
- **Phase 2: Contracts & Types**: Define Zod schemas and TypeScript interfaces in `lib/services/sms-audit-contracts.ts`.
- **Phase 3: Audit Service Repository**: Implement database access and fallback in-memory store in `lib/services/sms-audit-service.ts`.
- **Phase 4: SMS Pipeline Integration**: Integrate logging into `sms-service.ts` for all outcomes (`SENT`, `FAILED`, `SKIPPED`).
- **Phase 5: Unit Tests**: Comprehensive unit test suite in `tests/unit/sms-audit-service.test.ts`.
- **Phase 6: Verification & Convergence**: Run all tests, typecheck, lint, and auto-sync Graphify AST map.
