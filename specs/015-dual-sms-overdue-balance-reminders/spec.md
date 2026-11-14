# Feature Specification: Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle

**Feature Key**: `ARL-22`  
**Feature Slug**: `015-dual-sms-overdue-balance-reminders`  
**Jira Story**: STORY-4.5: Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle  
**Epic**: EPIC-4: Business Intelligence, Analytics & Financial Reporting (`ARL-17`)  
**Status**: Ready for Planning & Implementation  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** configure and dispatch automated and manual overdue balance SMS reminders to both myself and indebted customers,  
**so that** customers receive clear, polite collection notices to settle their credit (utang) while keeping store operations informed without manual collection overhead.

---

## 2. Context & Business Rationale

In Philippine condiment wholesale operations (Toyo, Suka, Patis), credit transactions (*pautang*) to local sari-sari stores, carinderias, and eateries are standard practice. While previous baseline specifications limited SMS alerts strictly to the administrator, operational scale requires a dual-notification architecture:

1. **Administrator Operational SMS**: Internal alert enabling the store owner to monitor debt aging and prioritize physical route collection.
2. **Customer Courteous SMS**: Polite, branded payment reminder alerting the customer to prepare cash before delivery or collection rounds.
3. **Safety & Etiquette Controls**: A configurable settings toggle ensures automated customer messaging can be disabled at will, while on-demand "Send SMS" buttons empower the admin to nudge specific accounts selectively.

---

## 3. Business Invariants & Domain Rules

1. **Dual Notification Channels & Single-Channel Restriction**:
   - SMS remains the sole supported external communication channel (no email).
   - In-app alerts continue to render on the Executive Dashboard (`/dashboard`), Utang Tracker (`/customers/balances`), and Sale Invoice details (`/sales/[id]`).

2. **System Settings Extension (`system_settings`)**:
   - `notify_customer_sms`: Boolean flag (default `false`) controlling whether background/automated overdue sweeps dispatch SMS directly to customers.
   - `customer_sms_template`: Optional text template allowing custom reminder copy.
   - The Reminder Settings UI at `/settings/reminders` presents:
     - Number of days overdue threshold (`reminder_days`, default: 7).
     - Admin mobile number (`admin_mobile`).
     - Explicit toggle/checkbox: `"Also send SMS reminder to customer when overdue"`.
     - Sample message previews showing both the Admin Operational copy and the Customer Courteous copy.

3. **Customer Mobile Number Validation & Philippine Phone Standard**:
   - Automated and manual customer SMS dispatches require a valid Philippine mobile number format:
     $$\text{Pattern: } ^(09|\+639)\d{9}$$
   - Normalized E.164-compatible format: `+639XXXXXXXXX`.
   - If the customer record has no mobile number or an invalid phone number:
     - Automated sweeps dispatch the admin operational SMS normally.
     - Customer SMS is safely skipped with an audit log / note: `"Customer SMS skipped: No valid mobile number"`.
     - Manual UI buttons for customer SMS show an informative disabled state or alert toast informing the admin that no valid phone number exists.

4. **Automated Dual SMS Trigger Condition**:
   - A sale qualifies for automated reminder dispatch if and only if:
     1. Payment status is `Not Yet Paid` or `Partially Paid` (`balance > 0`).
     2. The sale age in days ($\text{days\_unpaid} \ge \text{reminder\_days}$).
     3. Cool-down rule: No automated reminder was dispatched within the last 24 hours (`last_sms_sent_at` is null or $\ge 24\text{ hours}$ ago).
   - If `notify_customer_sms` is `true` and the customer has a valid phone number, the customer SMS is dispatched concurrently with the admin SMS.

5. **Manual On-Demand Customer Nudge**:
   - Available on `/customers/balances` (Utang Tracker table row action) and `/sales/[id]` (Overdue Alert banner action).
   - Admin can trigger an immediate customer reminder on-demand regardless of whether automated customer SMS is toggled on or off.
   - Clicking `"Send SMS Reminder"` triggers the SMS gateway, shows immediate UI feedback (toast: `"SMS reminder sent to {customer_name}"`), and activates a temporary debounce/cooldown to prevent rapid multi-clicks.

6. **Immediate Deactivation upon Settlement**:
   - Once a payment reduces the outstanding balance to $\text{₱0.00}$ and payment status becomes `Paid`:
     - All automated reminder dispatches for this receipt cease immediately.
     - Overdue alert banners on `/sales/[id]` are removed.
     - The sale is excluded from the overdue queue on `/customers/balances` and `/dashboard`.

7. **Error Resilience & Failure Isolation**:
   - SMS gateway failures (network errors, insufficient gateway credits, provider timeouts) MUST NOT roll back or block core POS, sales, or payment recording transactions.
   - Failures must be logged cleanly and reported via toast notification without throwing unhandled server exceptions.

8. **Zero Hardcoded Colors & Theme Compliance**:
   - All banners, buttons, toggle controls, and badges must strictly utilize semantic utility classes and design tokens (`bg-primary`, `bg-bg-surface`, `border-border`, `text-text-primary`, `text-danger`, etc.).

---

## 4. Message Copy Specifications

### Admin Operational SMS
```text
ARLQ Alert: {customer_name} still owes ₱{balance} for receipt {receipt_number}. Unpaid for {days_unpaid} days (limit: {reminder_days} days). Reminders stop once marked Paid.
```

### Customer Courteous SMS
```text
ARLQ Condiments: Good day, {customer_name}! Friendly reminder that receipt {receipt_number} has an outstanding balance of ₱{balance} (due after {reminder_days} days). Kindly settle at your earliest convenience. Thank you for your continued business!
```

---

## 5. Gherkin Acceptance Criteria

```gherkin
Feature: Dual SMS Overdue Balance Reminders for Admin & Customer (ARL-22)

  Scenario 1: Automated Dual SMS Dispatch on Overdue Threshold
    Given an active sale with payment status "Not Yet Paid" and balance 1340.00
    And the sale was issued 10 days ago (reminder_days is 7)
    And "notify_customer_sms" is enabled in system settings
    And the customer "Aling Nena's Sari-Sari Store" has mobile "0918 123 4567"
    When the automated overdue reminder sweep executes
    Then an operational SMS alert is dispatched to admin mobile "0917 555 0142"
    And a courteous SMS reminder is dispatched to customer mobile "0918 123 4567"
    And the sale's "last_sms_sent_at" timestamp is updated

  Scenario 2: Graceful Degradation When Customer Has No Mobile Number
    Given an overdue sale with balance 500.00 for customer "Walk-in Buyer"
    And the customer has no mobile number recorded
    And "notify_customer_sms" is enabled
    When the automated overdue check executes
    Then the admin operational SMS is dispatched to admin mobile "0917 555 0142"
    And the customer SMS dispatch is skipped without error
    And the system records an audit note "Customer SMS skipped: No valid mobile number"

  Scenario 3: Customer SMS Toggle in Settings (/settings/reminders)
    Given an administrator accessing the Reminder Settings form at "/settings/reminders"
    When viewing the configuration fields
    Then an explicit toggle "Also send SMS reminder to customer when overdue" is displayed
    And saving the form with the toggle enabled updates "notify_customer_sms" to true
    And displays a success toast "Reminder settings saved"

  Scenario 4: Manual Customer SMS Nudge from Utang Tracker (/customers/balances)
    Given an overdue customer listed on "/customers/balances"
    And the customer has a valid mobile number "0920 987 6543"
    When the admin clicks the action button "Send SMS Reminder"
    Then an on-demand SMS reminder is sent directly to "0920 987 6543"
    And an immediate UI toast confirms "SMS reminder sent to {customer_name}"
    And the action button enters a cooldown state to prevent duplicate clicks

  Scenario 5: Manual Customer SMS Nudge from Sale Invoice (/sales/[id])
    Given a sale invoice with an outstanding balance of 850.00 that is overdue
    And the customer has a valid mobile number
    When the admin views the overdue alert banner on "/sales/[id]"
    Then a "Send SMS to Customer" button is available within the overdue banner
    And clicking it dispatches the reminder and updates the banner subtext to reflect the dispatch timestamp

  Scenario 6: Immediate Deactivation upon Payment Settlement
    Given a sale that has previously triggered overdue SMS reminders
    When the admin records a payment that settles the balance to 0.00 and transitions status to "Paid"
    Then all automated SMS dispatches for this receipt immediately cease
    And the overdue alert banner is removed from the sale detail page
```

---

## 6. Success Criteria

1. **Dual Dispatch Integrity**: 100% of overdue sales meeting criteria trigger both admin and customer notifications when customer toggle is enabled.
2. **Customer Opt-Out & Safety**: Zero customer SMS messages are dispatched automatically when `notify_customer_sms` is `false`.
3. **Number Sanitization**: 100% of valid Philippine mobile numbers (`09...`, `+639...`) are parsed and normalized before dispatch.
4. **Duplicate Prevention**: Automated checks enforce a minimum 24-hour cool-down per sale receipt.
5. **UI Responsiveness & Cooldown**: Manual nudge triggers provide instant visual feedback (toast + button disabled/cooldown) within 150ms.
6. **Zero Regression**: Existing 180 tests continue to pass without error.

