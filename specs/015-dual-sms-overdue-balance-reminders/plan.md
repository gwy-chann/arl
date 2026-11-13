# Technical Implementation Plan: Dual SMS Overdue Balance Reminders (ARL-22)

**Feature Key**: `ARL-22`  
**Feature Slug**: `015-dual-sms-overdue-balance-reminders`  
**Jira Story**: STORY-4.5: Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle  
**Epic**: EPIC-4: Business Intelligence, Analytics & Financial Reporting (`ARL-17`)  

---

## 1. Architectural Blueprint & Boundary Mapping

```mermaid
flowchart TD
    subgraph UI ["User Interface Layer"]
        A[ReminderSettingsForm\n/settings/reminders]
        B[CustomerUtangTracker\n/customers/balances]
        C[OverdueAlertBanner\n/sales/[id]]
    end

    subgraph Actions ["Server Actions Layer"]
        D[saveReminderSettingsAction]
        E[sendCustomerSmsReminderAction]
        F[triggerAutomatedSmsSweepAction]
    end

    subgraph Services ["Domain Services Layer"]
        G[SettingsService\ngetSystemSettings / updateReminderSettings]
        H[SmsService\ndispatchSms / dispatchOverdueBalanceReminders]
        I[SaleService\ngetSaleById / updateLastSmsSentAt]
        J[CustomerService\ngetCustomerUtangSummary]
    end

    subgraph Storage ["Storage / Database"]
        K[(Supabase / In-Memory Store\nsystem_settings, sales, customers)]
    end

    A --> D --> G --> K
    B --> E --> H --> K
    C --> E --> H --> K
    F --> H
    H --> I --> K
    H --> J --> K
```

---

## 2. Component Hierarchy & Touchpoints

1. **`lib/services/sms-service.ts`**:
   - Resilient SMS gateway dispatcher.
   - Core templates for Admin Operational Digest & Customer Courteous Notice.
   - Philippine mobile number normalization.
   - Sweep orchestrator evaluating overdue sales, applying 24h cooldown, and isolating gateway errors.

2. **`lib/settings/settings-contracts.ts` & `lib/settings/settings-service.ts`**:
   - Add `notify_customer_sms: boolean` and `customer_sms_template?: string | null` to `SystemSettingsDTO`, Zod schemas, defaults, and Supabase upserts.
   - Add `formatCustomerReminderSampleMessage`.

3. **`lib/settings/settings-actions.ts`**:
   - Update `saveReminderSettingsAction` to accept and persist `notify_customer_sms`.

4. **`components/settings/reminder-settings-form.tsx`**:
   - Checkbox toggle for customer SMS with helper description.
   - Two preview cards: Admin Operational Digest and Customer Courteous Reminder.

5. **`components/customers/customer-utang-tracker.tsx`**:
   - Update Reminders stat card to reflect customer SMS status (`"SMS to Admin & Customers"` vs `"SMS to Admin only"`).
   - Add "Send SMS" manual nudge action button in table rows for debtors with valid mobile numbers.
   - Debounce and toast on trigger.

6. **`components/sales/overdue-alert-banner.tsx`**:
   - Elevate banner into a rich interactive component containing a `"Send SMS to Customer"` button.
   - Displays last dispatched timestamp and reflects live action status.

---

## 3. Strict Design Tokens & Zero Hardcoded Colors Rule

- **Buttons**:
  - Primary button: `bg-primary hover:bg-primary-hover text-text-light`
  - Secondary button: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border`
- **Surfaces & Cards**: `bg-bg-surface border border-border rounded-xl`
- **Banners & Badges**:
  - Overdue notice: `bg-danger-light border border-danger-border text-danger`
  - Warning notice: `bg-accent-light border border-accent-border text-accent`
- **Text & Muted**: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Strictly zero inline hex codes and zero default Tailwind utility colors.

---

## 4. Test Strategy

1. **Unit Tests (`tests/sms-reminders.test.ts`)**:
   - Philippine phone number validation and normalization.
   - Admin & customer message template generation.
   - 24-hour rate limiting / cooldown calculation.
   - Settings extension persistence and defaults.
   - Automated sweep dual dispatch orchestration (both admin and customer).
   - Graceful skipping when customer has no valid phone.
   - Immediate cessation when sale balance is zero (`Paid`).

2. **Regression & Health Checks**:
   - Node.js test runner passes all suites: `npm test`.
   - TypeScript compiles cleanly: `npx tsc --noEmit`.

