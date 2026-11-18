# Quickstart & Verification Guide: Customer Profile Persistence & Real-Time Balances Cache Invalidation

**Feature Key**: `ARL-37`  
**Feature Slug**: `026-customer-profile-persistence-balances-sync`  
**Jira Story**: STORY-4.4: Customer Profile Persistence & Real-Time Balances Cache Invalidation  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  

---

## 1. Running Automated Test Suites

Execute the unit and integration tests verifying customer persistence, balance rollups, and cache invalidation invariants:

```bash
npm test tests/customer-utang-tracker.test.ts tests/customer-profile.test.ts
```

Execute TypeScript typecheck to verify zero type regressions:

```bash
npx tsc --noEmit
```

---

## 2. Interactive Storefront Verification Scenarios

### Scenario 1: Verify Customer Edit Form Persistence
1. Start the development server: `npm run dev`.
2. Navigate to `http://localhost:3000/customers/k1/edit` (*Aling Nena's Sari-Sari Store*).
3. Update the phone number to `0917 999 8888` and click **Save changes**.
4. Navigate to `http://localhost:3000/customers/balances`.
5. Observe that *Aling Nena's Sari-Sari Store* displays the new phone number `0917 999 8888` immediately without a hard refresh.
6. Restart the development server (`Ctrl+C` then `npm run dev`).
7. Refresh the page: the phone number persists as `0917 999 8888`.

### Scenario 2: Settle Debt and Verify Auto-Removal from Balances
1. Navigate to `http://localhost:3000/sales/s2` (Aling Nena's ₱1,340 debt).
2. Record payment of ₱1,340 (marking payment status as `Paid`).
3. Navigate to `http://localhost:3000/customers/balances`.
4. Observe that *Aling Nena's Sari-Sari Store* is no longer present in the Utang Tracker table.
5. Navigate to `http://localhost:3000/customers`.
6. Confirm *Aling Nena's Sari-Sari Store* is still fully intact in the Customer Directory with ₱0.00 debt balance.

### Scenario 3: Create New Customer with ₱0 Balance
1. Navigate to `http://localhost:3000/customers/new`.
2. Add a new customer (*Aling Roselle*, phone: `0918 555 1234`).
3. Click **Save Customer**.
4. Observe that *Aling Roselle* appears in `/customers` directory.
5. Navigate to `/customers/balances` and verify she does **not** appear until an unpaid sale is created.
