# Quickstart & Verification Guide: Customer Directory & Live Balance Rollup

**Feature Key**: `ARL-9`  
**Feature Slug**: `007-customer-directory-balance-rollup`  

---

## 1. Automated Test Verification

Run all unit tests verifying customer validation, balance rollup calculation, formatting, and search filtering:

```bash
cd .worktrees/ARL-9
npm test
```

Expected output:
- `Customer Directory with Contact Book & Balance Rollup (ARL-9)` test suite passes with 0 failures.
- All existing suites (`categories`, `products`, `layout-navigation`, `theme`, `modal-toast`) continue to pass.

---

## 2. Interactive Verification Scenarios

### Scenario 1: Registering a Sari-Sari Store Customer
1. Navigate to `/customers/new`.
2. Enter:
   - **Name**: `Aling Nena's Sari-Sari Store`
   - **Phone**: `0917 301 4488`
   - **Address**: `Purok 3, Brgy. San Roque`
3. Click **Save customer**.
4. **Verification**:
   - Customer profile page opens (`/customers/[id]`).
   - Toast notification appears: `"Customer saved"`.
   - Contact details match entered values.

### Scenario 2: Real-Time Search Filtering
1. Navigate to `/customers`.
2. Type `"Carinderia"` into the search box.
3. **Verification**:
   - Only `Mang Tonyo Carinderia` (or matching records) remains visible.
   - Cleared search input restores all customers immediately.

### Scenario 3: Debt Balance Highlighting
1. On `/customers`, locate a customer with unpaid balance (e.g., ₱1,340.00).
2. **Verification**:
   - Balance column renders `₱1,340.00` in destructive red (`text-danger` / `var(--bad)`).

### Scenario 4: Fully Settled Balance Display
1. On `/customers`, locate a customer with 0 unpaid sales.
2. **Verification**:
   - Balance column renders a muted dash (`-`) with `text-text-muted`.
