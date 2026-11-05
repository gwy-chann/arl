# Feature Specification: System Settings for Reminder Thresholds, Stock Minimums & Admin Security

**Feature Key**: `ARL-21`  
**Feature Slug**: `008-system-settings-admin-security`  
**Jira Story**: STORY-4.4: System Settings for Reminder Thresholds, Stock Minimums & Admin Security  
**Epic**: EPIC-4: Store Operations, Customer Ledgers & System Configuration  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** configure payment reminder threshold days, admin SMS mobile number, product minimum stock levels, and update password security,  
**so that** the application strictly enforces our store operational parameters and access protection.

---

## 2. Business Invariants & Rules

1. **System Reminder Settings (`/settings/reminders`)**:
   - `reminder_days` (Send reminder after days unpaid):
     - Integer $\ge 1$, default 7 days.
     - Controls overdue cutoff for credit/utang sales across Dashboard and Balances views.
     - Any sales transaction with `amount_paid < total_amount` and `days_unpaid >= reminder_days` is classified as "Overdue".
   - `admin_mobile` (Administrator mobile number):
     - Philippine mobile number format (e.g., `0917 555 0142`), trimmed, required.
     - Invariant: Reminders are operational internal notifications sent exclusively to store administrators, never to customers directly.
   - `notification_channel`:
     - Fixed to `'SMS'` (disabled select in UI, hint: "SMS is the only channel. Alerts also show on the Dashboard.").
   - Preview message box displays live interpolated sample text:
     `ARLQ: Aling Nena’s Sari-Sari Store still owes ₱1,340.00 for receipt ARLQ-01058. Unpaid for {days} days. Reminders stop once the sale is marked Paid.`
   - Toast feedback upon successful save: `"Reminder settings saved"`.

2. **Batch Minimum Stock Thresholds Matrix (`/settings/stock`)**:
   - Manages minimum threshold limits across all active product variants.
   - For ARLQ's canonical 3 products (Toyo, Suka, Patis) and 3 sizes (350ml, 1L, 1gal), renders a 3x3 editable numeric matrix.
   - Each input accepts an integer $\ge 0$.
   - Batch update: When administrator modifies one or more minimum stock numbers and clicks "Save minimum levels", all modified/submitted variant thresholds (`min_stock_level`) are persisted in a single transactional batch operation.
   - Real-time recalculation: Any variant where `stock_quantity <= min_stock_level` is flagged as low stock across inventory alerts and dashboard notices immediately upon persistence.
   - Toast feedback upon successful save: `"Minimum stock levels saved"`.

3. **Administrator Password Security (`/settings/password`)**:
   - Security form fields:
     - `current_password`: string, required, autocomplete `current-password`.
     - `new_password`: string, min 8 characters, required, autocomplete `new-password`.
     - `confirm_password`: string, min 8 characters, required, autocomplete `new-password`.
   - Client-side validation:
     - If `new_password` length $< 8$ or `new_password !== confirm_password`, submission is immediately halted.
     - An error toast is triggered: `"New passwords do not match"`. No request is dispatched to the authentication server.
   - Submission:
     - On valid matching passwords ($\ge 8$ chars), calls Supabase Auth (`supabase.auth.updateUser({ password: new_password })`).
     - On success: Form is reset, and affirmative toast confirms `"Password updated"`.
     - On authentication rejection (e.g. invalid current password or auth session expired): User-friendly error message is displayed.

4. **Appearance & Settings Navigation Hub**:
   - Shared Settings Tab Bar across all settings sub-pages:
     - `Reminder settings` (`/settings/reminders`)
     - `Minimum stock levels` (`/settings/stock`)
     - `Appearance` (`/settings/appearance`)
     - `Change password` (`/settings/password`)
   - Route `/settings` defaults and redirects cleanly to `/settings/reminders`.
   - Consistent layout breadcrumb: `Dashboard / Settings / {Active Tab}`.
   - Conforms strictly to the Zero Hardcoded Colors Rule and semantic tokens (`bg-bg-surface`, `border-border`, `text-text-primary`, `bg-primary`, `bg-secondary`).

---

## 3. Gherkin Acceptance Criteria

```gherkin
Feature: System Settings for Reminder Thresholds, Stock Minimums & Admin Security (ARL-21)

  Scenario 1: Update overdue reminder threshold days
    Given the current reminder threshold is 7 days
    When the admin navigates to "/settings/reminders", modifies the threshold to 5 days, and saves
    Then the database setting is updated
    And sales older than 5 days immediately update to "Overdue" status across Dashboard and Balances views
    And a toast confirms: "Reminder settings saved"

  Scenario 2: Batch minimum stock thresholds update
    Given the 3x3 minimum stock matrix on "/settings/stock"
    When the admin edits minimum stock levels for multiple variants and clicks "Save minimum levels"
    Then all 9 product variant minimum stock values are updated in a single transaction
    And inventory low stock calculations immediately reflect the new thresholds
    And a toast confirms: "Minimum stock levels saved"

  Scenario 3: Change password validation
    Given an admin updating their password on "/settings/password"
    When the new password is shorter than 8 characters or does not match the confirmation password
    Then form submission is blocked with an error toast "New passwords do not match"
    And password update is not sent to the server

  Scenario 4: Successful password update
    Given valid current password and matching new password (>= 8 characters)
    When submitted
    Then Supabase Auth updates the administrator credentials
    And the form displays toast "Password updated"
```
