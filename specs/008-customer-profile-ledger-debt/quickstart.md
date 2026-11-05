# Quickstart & Verification Guide: Customer Profile View with Purchase Ledger & Debt Breakdown

**Feature Key**: `ARL-10`  
**Feature Slug**: `008-customer-profile-ledger-debt`  

---

## 1. Run Automated Test Suite

Execute the dedicated customer profile test suite validating all 4 acceptance scenarios:

```bash
node --test --experimental-strip-types tests/customer-profile.test.ts
```

Run all customer and application tests:

```bash
npm test
npm run typecheck
npm run lint
```

---

## 2. Interactive Manual Verification Scenarios

Start the local development server:

```bash
npm run dev
```

### Scenario 1: Customer Profile Overview with Debt
1. Open `http://localhost:3000/customers/k2` in the browser.
2. Verify header displays:
   - Name: `Mang Tonyo Carinderia`
   - Subtitle: `0928 554 1290 · Public Market Stall 14`
3. Verify right card displays:
   - Large balance `₱240.00` highlighted in red (`text-danger`).
   - Unpaid sale `ARLQ-01063` listed with days outstanding and an `"Overdue"` status pill.
   - Clicking `ARLQ-01063` navigates to `/sales/s4`.

### Scenario 2: Transaction History Table
1. Verify the Transaction History table displays all past sales for the customer chronologically.
2. Confirm columns: Receipt, Date, Total, Balance, Payment, and Order.
3. Confirm Paid rows show green pill, Partially Paid shows amber pill.

### Scenario 3: Pre-Selected New Sale Trigger
1. On `http://localhost:3000/customers/k2`, click the `"New sale"` button in the header.
2. Verify browser navigates to `/sales/new?customerId=k2`.
3. Confirm the customer dropdown is pre-populated with `"Mang Tonyo Carinderia"`.

### Scenario 4: Fully Settled Customer Account
1. Open a settled customer profile (e.g. `http://localhost:3000/customers/k3` Lola Remedios Eatery).
2. Verify the balance displays `₱0.00` in standard ink text.
3. Confirm the explanatory subtext displays: `"Fully paid. Nothing is owed."`
