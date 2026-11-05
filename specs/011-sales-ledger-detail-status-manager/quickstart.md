# Quickstart & Verification Guide: Sales Ledger, Detail View & Status Manager

**Feature Key**: `ARL-15`  
**Feature Slug**: `011-sales-ledger-detail-status-manager`  

---

## 1. Running the Feature Locally

1. Start development server inside the worktree:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/sales`.

---

## 2. Interactive Scenarios & Manual Verification

### Scenario 1: Sales ledger search and status filtering (AC 1)
1. Go to `/sales`.
2. Observe all sales listed in the table.
3. In the "All payments" filter, select **Not Yet Paid**.
4. Verify that only unpaid sales are displayed in the table.
5. In the search box, type receipt number `ARLQ-01063` or customer `Tonyo`.
6. Verify table filters instantly.
7. Click any row; verify it navigates directly to that sale's detail page (`/sales/{id}`).

### Scenario 2: Overdue sale alert banner (AC 2)
1. View a sale that has an unpaid balance and has been unpaid for 9 days (e.g. seed sale or simulated unpaid sale).
2. Verify an alert banner displays in red:
   - "Overdue by 2 days past the reminder limit. Unpaid for 9 days. An SMS reminder was sent to 0917 555 0142. It stops when you mark this sale as Paid."

### Scenario 3: Payment status update to fully paid (AC 3)
1. Open an unpaid sale with balance ₱1,340.00 displaying the overdue banner.
2. In the Payment card, click the segmented control **Paid**.
3. Click **Save payment**.
4. Verify:
   - Database and memory update `amount_paid = 1340.00` and `balance = 0`.
   - The overdue alert banner immediately disappears.
   - Toast confirms: `Payment updated: Paid. Reminders stopped.`

### Scenario 4: Order fulfillment state transition (AC 4)
1. In the Order card on the sale detail page, select **Delivered**.
2. Click **Save order status**.
3. Verify:
   - Order pill updates to "Delivered" with an informational blue token (`pill info bg-info-light text-info border border-info-border`).
   - Toast confirms: `Order marked Delivered`.

---

## 3. Automated Test Verification

Run test suites inside the worktree:
```bash
npm test
```
