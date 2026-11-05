# Data Model: Customer Profile View with Purchase Ledger & Debt Breakdown

**Feature Key**: `ARL-10`  
**Feature Slug**: `008-customer-profile-ledger-debt`  

---

## 1. Domain Entities & Schemas

### `CustomerProfileData`
Represents the complete customer profile aggregation for `/customers/[id]`.

```typescript
export interface CustomerDTO {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface SaleSummary {
  id: string;
  receipt_number: string;
  customer_id: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: 'Paid' | 'Partially Paid' | 'Not Yet Paid';
  order_status: 'Pending' | 'Delivered' | 'Picked Up';
  created_at: string;
  days_outstanding?: number;
  is_overdue?: boolean;
}

export interface CustomerProfileData extends CustomerDTO {
  debt_balance: number;
  purchase_count: number;
  sales: SaleSummary[];
}
```

---

## 2. Invariants & Computed Metrics

1. **Balance Rollup**:
   $$\text{debt\_balance} = \sum_{s \in \text{sales}} \max(0, s.\text{total\_amount} - s.\text{amount\_paid})$$
2. **Days Outstanding**:
   $$\text{days\_outstanding}(s) = \max\left(0, \left\lfloor \frac{T_{\text{now}} - T_{\text{sale}}}{86,400,000} \right\rfloor\right)$$
3. **Overdue Status**:
   $$\text{is\_overdue}(s) = (s.\text{balance} > 0) \land (\text{days\_outstanding}(s) \ge \text{thresholdDays})$$
   (Default threshold: 7 days)
4. **Settled Balance Status**:
   $$\text{debt\_balance} \le 0 \implies \text{formatted} = \text{"₱0.00"}, \text{note} = \text{"Fully paid. Nothing is owed."}$$

---

## 3. UI Presentation States

| State | Debt Balance | Itemized Unpaid List | Display Treatment |
| :--- | :--- | :--- | :--- |
| **Active Debt (Normal)** | $> 0$ | Unpaid sales with days $< 7$ | Red balance text (`text-danger`), days outstanding subtext |
| **Overdue Debt** | $> 0$ | Unpaid sales with days $\ge 7$ | Red balance text, days outstanding subtext + `"Overdue"` badge |
| **Fully Settled** | $= 0$ | Empty (`[]`) | Standard text (`text-text-primary`), `"Fully paid. Nothing is owed."` |
| **Zero Transactions** | $= 0$ | Empty (`[]`) | Table shows *"No purchases yet"*, balance card shows `"₱0.00"` |
