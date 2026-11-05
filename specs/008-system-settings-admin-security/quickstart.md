# Quickstart & Verification Scenarios: System Settings & Admin Security

**Feature Key**: `ARL-21`  
**Feature Slug**: `008-system-settings-admin-security`  

---

## 1. Automated Verification Suite

Run all unit and integration tests for system settings:

```bash
npm test
```

Specific test run:
```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/settings.test.ts"
```

---

## 2. Interactive Verification Walkthroughs

### Scenario 1: Update Overdue Reminder Threshold Days
1. Log in as store administrator and navigate to `/settings/reminders`.
2. Notice the current value for **Send a reminder after (days unpaid)** (default: `7`).
3. Notice the sample reminder preview text showing `Unpaid for 7 days.`.
4. Change the threshold value to `5` and ensure admin mobile number is filled (e.g., `0917 555 0142`).
5. Click **Save settings**.
6. **Expected outcome**:
   - A success toast appears: `"Reminder settings saved"`.
   - The preview updates to show `Unpaid for 5 days.`.
   - Any unpaid customer sales with age $\ge 5$ days are flagged as **Overdue** across the Dashboard and Balances views.

---

### Scenario 2: Batch Minimum Stock Thresholds Update
1. Navigate to `/settings/stock`.
2. Inspect the 3x3 table representing Toyo, Suka, and Patis across sizes (350ml, 1L, 1gal).
3. Modify the minimum threshold numbers for multiple variants (e.g., update Toyo 350ml from 48 to 50, Patis 1L from 24 to 30).
4. Click **Save minimum levels**.
5. **Expected outcome**:
   - A success toast appears: `"Minimum stock levels saved"`.
   - The changes persist in `product_variants.min_stock_level`.
   - Variants with current stock $\le$ new minimum threshold immediately show low stock warnings.

---

### Scenario 3: Change Password Validation Safeguard
1. Navigate to `/settings/password`.
2. Enter current password: `password123`.
3. Enter new password: `short` (< 8 characters) or enter mismatching passwords in `New password` and `Confirm new password`.
4. Click **Update password**.
5. **Expected outcome**:
   - Form submission is halted immediately.
   - An error toast appears: `"New passwords do not match"`.
   - No request is dispatched to Supabase Auth.

---

### Scenario 4: Successful Password Update
1. On `/settings/password`, enter current password `password123`.
2. Enter matching new password with $\ge 8$ characters (e.g., `newSuperSecurePassword2026!`) in both new and confirm password inputs.
3. Click **Update password**.
4. **Expected outcome**:
   - Supabase Auth credentials are successfully updated.
   - Form inputs are cleared.
   - A success toast confirms: `"Password updated"`.
