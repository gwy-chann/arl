# Data Model & Domain Entities: Printable Official Sales Receipt

**Feature Key**: `ARL-16`  
**Feature Slug**: `012-printable-sales-receipt`  

---

## 1. Entity Models

The printable receipt operates on the `SaleDetail` domain model established in `ARL-14` / `ARL-15`, projecting it into a receipt-optimized data structure.

### `ReceiptSnapshot`
```typescript
export interface ReceiptItemSnapshot {
  id: string;
  variant_id: string;
  variant_label: string; // e.g. "Patis - 1 L" or "Toyo - 350 ml"
  product_name: string;
  packaging_size: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export type ReceiptPaymentStatus = 'PAID' | 'PARTIALLY PAID' | 'NOT YET PAID';

export interface ReceiptSnapshot {
  id: string;
  receipt_number: string;
  created_at: string;
  formatted_date: string; // e.g. "Oct 11, 2026"
  customer_id: string;
  customer_name: string;
  items: ReceiptItemSnapshot[];
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: ReceiptPaymentStatus;
}
```

---

## 2. Status Stamp Logic & State Matrix

| Payment Condition | Stamp Text | Semantic Token Class | Mockup Hex (Light / Dark) |
| :--- | :--- | :--- | :--- |
| `balance <= 0` | `PAID` | `text-success` | `#095B06` / `#4ADE80` |
| `balance > 0 && amount_paid > 0` | `PARTIALLY PAID` | `text-accent` | `#B45309` / `#FBBF24` |
| `amount_paid == 0` | `NOT YET PAID` | `text-danger` | `#DC2626` / `#F87171` |

---

## 3. Transformation Helper: `toReceiptSnapshot(sale: SaleDetail): ReceiptSnapshot`

Maps the database-backed `SaleDetail` into a thermal receipt snapshot:
- Formats dates using `en-US` (`month: 'short', day: 'numeric', year: 'numeric'`).
- Builds variant labels in the format `${item.product_name} - ${formatSizeLabel(item.size)}`.
- Determines the exact uppercase `ReceiptPaymentStatus`.
- Calculates line totals and guarantees numeric precision.
