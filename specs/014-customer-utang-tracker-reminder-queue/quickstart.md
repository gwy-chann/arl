# Quickstart & Verification Guide: Customer Utang Tracker & Overdue Reminder Queue

**Feature Key**: `ARL-19`  
**Feature Slug**: `014-customer-utang-tracker-reminder-queue`  

---

## 1. Automated Verification

Execute the feature-specific test suite:

```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types tests/customer-utang-tracker.test.ts
```

Execute the full regression test suite:

```bash
npm test
```

Execute TypeScript typecheck & lint:

```bash
npm run typecheck
npm run lint
```

---

## 2. Manual UI Verification Walkthrough

1. **Launch Next.js Dev Server**:
   ```bash
   npm run dev
   ```
2. **Navigate to Customer Utang Center**:
   Open browser at `http://localhost:3000/customers/balances`.
3. **Verify Header & Breadcrumbs**:
   - Verify breadcrumb displays `Customers` (clickable to `/customers`) and `Balances`.
   - Verify page title is `Customers with balances (utang)` and subtitle is `Unpaid and partially paid sales.`.
4. **Verify 3-Column KPI Stats**:
   - Card 1: `Total owed` shows formatted total unpaid amount (e.g. `₱2,080.00`) and `${count} customers`.
   - Card 2: `Overdue (7+ days)` shows formatted overdue amount with red alert text and overdue customer count.
   - Card 3: `Reminders` shows `SMS to 0917 555 0142` and `after 7 days unpaid`.
5. **Verify Debt Age Sorting & Badges**:
   - Table rows are ordered with highest days outstanding first (e.g., 30 days, 19 days, 10 days, 3 days).
   - Rows with days $\ge 7$ display red `Overdue` badge.
   - Rows with days $< 7$ display amber `Not yet due` badge.
6. **Verify Direct Navigation**:
   - Click receipt number link in the "Oldest unpaid sale" column $\rightarrow$ navigates to `/sales/[id]`.
   - Click `"Open profile"` button in the Action column $\rightarrow$ navigates to `/customers/[id]`.
7. **Verify Empty State**:
   - When no balances are owed, page displays `No balances` with subtext `All customer accounts are fully paid.`.
