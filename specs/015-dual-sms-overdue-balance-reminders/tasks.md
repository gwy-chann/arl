# Tasks: Dual SMS Overdue Balance Reminders for Admin & Customer (ARL-22)

**Feature Key**: `ARL-22`  
**Feature Slug**: `015-dual-sms-overdue-balance-reminders`  
**Jira Story**: STORY-4.5: Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle  
**Status**: Ready for Pull Request  

---

## Phase 1: Database Migration & Schema Contracts

- [x] `T-1.1`: Create Supabase migration `supabase/migrations/20261114000000_dual_sms_reminders.sql` extending `system_settings` (`notify_customer_sms`, `customer_sms_template`) and `sales` (`last_sms_sent_at`).
- [x] `T-1.2`: Update `lib/settings/settings-contracts.ts` with `notify_customer_sms` and `customer_sms_template` in `reminderSettingsSchema` and `SystemSettingsDTO`.
- [x] `T-1.3`: Create `lib/services/sms-contracts.ts` with Zod validation schemas for Philippine mobile numbers, manual nudge payloads, and message formatting helpers.

---

## Phase 2: Domain Services & SMS Gateway Engine

- [x] `T-2.1`: Implement `lib/services/sms-service.ts` featuring:
  - Phone validation and normalization for Philippine numbers (`09...`, `+639...`).
  - Copy generators for Admin Operational Digest and Customer Courteous Notice.
  - Gateway dispatcher interface with in-memory test provider and dispatch history audit log.
  - Automated sweep orchestrator `dispatchOverdueBalanceReminders` respecting the 24-hour cool-down, checking `notify_customer_sms`, and gracefully skipping missing customer numbers.
- [x] `T-2.2`: Extend `lib/settings/settings-service.ts` to support `notify_customer_sms` and `customer_sms_template` across in-memory baseline and Supabase queries/upserts.
- [x] `T-2.3`: Extend `lib/sales/sale-service.ts` to support reading and updating `last_sms_sent_at` on sales records.

---

## Phase 3: Server Actions & Manual Trigger API

- [x] `T-3.1`: Update `lib/settings/settings-actions.ts` to accept `notify_customer_sms` in `saveReminderSettingsAction`.
- [x] `T-3.2`: Implement `sendCustomerSmsReminderAction` in `lib/customers/customer-actions.ts` or `lib/sales/sale-actions.ts` allowing immediate manual customer nudges with debounce and feedback.

---

## Phase 4: UI Enhancements & Components

- [x] `T-4.1`: Update `components/settings/reminder-settings-form.tsx` to include:
  - Checkbox toggle for `"Also send SMS reminder to customer when overdue"`.
  - Preview card for Customer Polite Reminder alongside Admin digest preview.
  - Accurate toast feedback on save.
- [x] `T-4.2`: Update `components/customers/customer-utang-tracker.tsx` to:
  - Reflect active customer notification status in the Reminders KPI stats card.
  - Add `"Send SMS"` action button for each debtor with a valid mobile number, with cooldown state and toast feedback.
- [x] `T-4.3`: Update `components/sales/overdue-alert-banner.tsx` to:
  - Provide a `"Send SMS to Customer"` button.
  - Display the last dispatched timestamp and debounce successive clicks.

---

## Phase 5: Automated Verification & Unit Tests

- [x] `T-5.1`: Create `tests/sms-reminders.test.ts` covering all 6 Gherkin acceptance criteria:
  - Scenario 1: Automated dual dispatch (admin + customer) when threshold reached and customer SMS enabled.
  - Scenario 2: Graceful degradation when customer lacks mobile number (admin SMS dispatched, customer SMS skipped with audit note).
  - Scenario 3: Customer SMS toggle updates and persists in settings.
  - Scenario 4: Manual customer SMS nudge from Utang Tracker (`/customers/balances`).
  - Scenario 5: Manual customer SMS nudge from Sale Invoice banner (`/sales/[id]`).
  - Scenario 6: Immediate cessation of reminders when sale balance settles to 0.00 (`Paid`).
- [x] `T-5.2`: Run test suite with Node.js test runner (`npm test`).
- [x] `T-5.3`: Verify strict TypeScript compilation (`npx tsc --noEmit`).

---

## Phase 6: Convergence, Quality Checks & Pull Request

- [x] `T-6.1`: Verify Zero Hardcoded Colors compliance across all modified UI components.
- [ ] `T-6.2`: Stage and commit changes using structured Conventional Commits referencing `[ARL-22]`.
- [ ] `T-6.3`: Push branch `feat/ARL-22` and create Pull Request linking Jira issue `ARL-22`.

