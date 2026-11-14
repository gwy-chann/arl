# Technical Research: Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle

**Feature Key**: `ARL-22`  
**Feature Slug**: `015-dual-sms-overdue-balance-reminders`  
**Jira Story**: STORY-4.5: Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle  

---

## 1. Architectural Strategy & Stack Constraints

1. **Framework & Engine**:
   - Next.js 16+ App Router with React 19.
   - Server Actions (`'use server'`) for dispatching on-demand SMS reminders and updating reminder settings.
   - Deterministic testing with Node.js test runner (`node --test --experimental-strip-types "tests/*.test.ts"`).

2. **Database & Schema Architecture (Supabase / Postgres)**:
   - Schema Extension on `public.system_settings`:
     ```sql
     ALTER TABLE public.system_settings 
       ADD COLUMN IF NOT EXISTS notify_customer_sms BOOLEAN NOT NULL DEFAULT false,
       ADD COLUMN IF NOT EXISTS customer_sms_template TEXT NULL;
     ```
   - Schema Extension on `public.sales`:
     ```sql
     ALTER TABLE public.sales
       ADD COLUMN IF NOT EXISTS last_sms_sent_at TIMESTAMPTZ NULL;
     ```
   - Resilient in-memory mock fallback in `lib/settings/settings-service.ts` and `lib/sales/sale-service.ts` so all features work seamlessly both with Supabase and in standalone local/test environments.

3. **SMS Notification Gateway & Dispatch Engine (`lib/services/sms-service.ts`)**:
   - Pluggable gateway architecture:
     ```typescript
     export interface SmsDispatchPayload {
       recipientMobile: string;
       recipientType: 'ADMIN' | 'CUSTOMER';
       message: string;
       saleId?: string;
       receiptNumber?: string;
       customerId?: string;
       customerName?: string;
     }

     export interface SmsDispatchResult {
       success: boolean;
       messageId?: string;
       timestamp: string;
       error?: string;
     }
     ```
   - Standard mock/console provider for automated CI and headless testing that logs dispatched SMS payloads and tracks dispatch history in memory.
   - Automated sweep function `dispatchOverdueBalanceReminders(options)` that:
     1. Loads system settings (`reminder_days`, `admin_mobile`, `notify_customer_sms`).
     2. Identifies all overdue sales where `balance > 0`, `days_unpaid >= reminder_days`, and `last_sms_sent_at` is either null or older than 24 hours.
     3. Dispatches admin operational alert.
     4. If `notify_customer_sms` is enabled, sanitizes customer mobile number and dispatches customer courteous SMS.
     5. Updates `last_sms_sent_at` on the sale record.

4. **Phone Number Sanitization & Philippine Mobile Standard (`lib/utils/phone-utils.ts`)**:
   - Strict validation against Philippine mobile prefixes:
     - Local format: `09XXXXXXXXX` (11 digits).
     - International format: `+639XXXXXXXXX` (13 characters).
   - Sanitizer removes non-digit characters (spaces, dashes, parentheses) and normalizes to standard display format `09XX XXX XXXX` and E.164 `+639XXXXXXXXX`.

5. **UI & Component Touchpoints**:
   - **Settings (`components/settings/reminder-settings-form.tsx`)**:
     - Checkbox toggle: `"Also send SMS reminder to customer when overdue"`.
     - Subtext: `"When enabled, customers with overdue balances and valid mobile numbers will automatically receive polite reminders."`
     - Two sample message preview cards:
       1. Admin Operational Digest.
       2. Customer Polite Reminder.
   - **Utang Tracker (`components/customers/customer-utang-tracker.tsx`)**:
     - Status card update: Reflects whether customer SMS is enabled or disabled.
     - Row action: Secondary `"Send SMS"` action button alongside `"Open profile"`, disabled with tooltip/feedback if customer lacks a valid mobile number or if recently sent (cooldown).
   - **Sale Detail Banner (`components/sales/overdue-alert-banner.tsx`)**:
     - Elevated notice with action button `"Send SMS to Customer"`.
     - Displays timestamp of last SMS dispatch if available.

6. **Zero Hardcoded Colors & Accessibility Compliance**:
   - Complies strictly with `.agents/rules/tailwind-v4.md` and `AGENTS.md`.
   - Semantic tokens only: `bg-primary`, `bg-bg-surface`, `bg-danger-light`, `text-danger`, `border-danger-border`, `text-text-primary`, `text-text-secondary`, `text-text-muted`.
   - ARIA attributes: `role="alert"`, `aria-live="polite"`, `aria-busy` during manual dispatch transitions.

