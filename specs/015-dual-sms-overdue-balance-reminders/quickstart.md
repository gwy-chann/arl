# Quickstart & Verification Guide: Dual SMS Overdue Balance Reminders (ARL-22)

**Feature Key**: `ARL-22`  
**Feature Slug**: `015-dual-sms-overdue-balance-reminders`  

---

## 1. Automated Test Execution

Run the deterministic test suite:
```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/sms-reminders.test.ts"
```

Verify all system tests pass:
```bash
npm test
```

Verify strict type integrity:
```bash
npx tsc --noEmit
```

---

## 2. Walkthrough Scenarios

### Scenario A: Configuring Customer SMS Toggle in Settings
1. Navigate to `/settings/reminders`.
2. Locate the section: **"Customer SMS Reminders"**.
3. Toggle the checkbox: `"Also send SMS reminder to customer when overdue"`.
4. Observe the two live preview cards:
   - Admin Operational Digest preview.
   - Customer Courteous Notice preview.
5. Click **"Save settings"**.
6. Verify toast notification confirms `"Reminder settings saved"`.
7. Reload page and verify toggle state persists.

### Scenario B: Manual Customer Nudge from Utang Tracker (`/customers/balances`)
1. Navigate to `/customers/balances`.
2. Observe overdue debtors in the table.
3. For a debtor with a valid mobile number (e.g., Aling Nena's Sari-Sari Store), click the secondary action button **"Send SMS"** / **"Nudge"**.
4. Verify immediate feedback:
   - Button shows loading state (`"Sending..."`).
   - Success toast appears: `"SMS reminder sent to Aling Nena’s Sari-Sari Store"`.
   - Button enters cooldown to prevent duplicate dispatches.
5. For a debtor without a mobile number, verify the button indicates no phone number available.

### Scenario C: Manual Customer Nudge from Sale Invoice Detail (`/sales/[id]`)
1. Navigate to an overdue sale invoice (e.g. `/sales/sale-1058`).
2. Observe the Overdue Alert banner.
3. Banner contains the action button **"Send SMS to Customer"**.
4. Click the button.
5. Banner subtext updates to display: `"Last SMS reminder sent: Just now"`.
6. Verify toast confirms reminder dispatch.

### Scenario D: Immediate Cessation upon Payment Settlement
1. On the same sale invoice, record payment to reduce remaining balance to `₱0.00`.
2. Save payment.
3. Status changes to `Paid`.
4. Verify the Overdue Alert banner vanishes completely.
5. Verify on `/customers/balances` that the sale no longer contributes to the overdue balance.

