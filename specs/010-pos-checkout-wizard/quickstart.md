# Quickstart & Verification Guide: POS-Style Checkout Wizard

**Feature Key**: `ARL-14`  
**Feature Slug**: `010-pos-checkout-wizard`  

---

## 1. Running the Feature Locally

1. Start development server inside the worktree:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/sales/new`.

---

## 2. Interactive Scenarios & Manual Verification

### Scenario 1: Multi-line sale with full payment (AC 1)
1. Select customer **Mang Tonyo Carinderia**.
2. Add line 1: Product **Patis**, Size **1 gal**, Quantity **2** (₱200 each).
3. Click **Add item**.
4. Add line 2: Product **Toyo**, Size **1 gal**, Quantity **1** (₱160 each).
5. In Summary, verify:
   - Items: `3 bottles`
   - Profit: `₱115.00`
   - Total: `₱560.00`
   - Payment status: `Paid`
   - Remaining balance: `₱0.00`
6. Click **Save sale**.
7. Verify toast: `Sale saved: ARLQ-XXXXX`.
8. Check that warehouse stock for Patis 1 gal is decremented by 2, and Toyo 1 gal is decremented by 1.

### Scenario 2: Partial payment with debt registration (AC 2)
1. Select any customer with grand total ₱1,200.00.
2. Select Payment status **Partially Paid**.
3. Enter Amount paid: `500`.
4. Verify remaining balance displays `₱700.00`.
5. Click **Save sale**.
6. Check customer directory to verify customer's debt balance increased by `₱700.00`.

### Scenario 3: Real-time over-stock warning (AC 3)
1. Select a variant with limited stock (e.g. Suka 1 gal has 6 bottles).
2. Set quantity to 7.
3. Verify note displays: `<b style="color:var(--bad)">Only 6 in stock.</b> Lower the quantity.`.
4. Verify **Save sale** button is disabled.

### Scenario 4: Fast customer pre-fill from profile (AC 4)
1. Navigate to `/sales/new?customerId=<lola-remedios-id>`.
2. Verify customer dropdown automatically defaults to **Lola Remedios Eatery**.

---

## 3. Automated Test Verification

Run test suites inside the worktree:
```bash
npm test
```
