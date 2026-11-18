# Interface & Validation Contracts: Customer Profile Persistence & Real-Time Balances Cache Invalidation

**Feature Key**: `ARL-37`  
**Feature Slug**: `026-customer-profile-persistence-balances-sync`  
**Jira Story**: STORY-4.4: Customer Profile Persistence & Real-Time Balances Cache Invalidation  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  

---

## 1. Customer Mutation Contracts (`lib/customers/customer-contracts.ts`)

```typescript
import { z } from 'zod';

export const customerInputSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional().default(''),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export interface CustomerActionResult {
  success: boolean;
  customerId?: string;
  customer?: CustomerWithRollup;
  error?: string;
  fieldErrors?: Record<string, string>;
}
```

---

## 2. Server Action Signatures & Invalidation Invariants

### 2.1 Customer Actions (`lib/customers/customer-actions.ts`)

```typescript
/**
 * Creates a new customer, persists to PostgreSQL public.customers, and purges route caches.
 * Invalidation paths: /customers, /customers/${customer.id}, /customers/balances, /reports/balances, /dashboard
 */
export async function createCustomerAction(
  input: CustomerInput
): Promise<CustomerActionResult>;

/**
 * Updates an existing customer profile, writes changes to PostgreSQL public.customers, and purges route caches.
 * Invalidation paths: /customers, /customers/${customer.id}, /customers/balances, /reports/balances, /dashboard
 */
export async function updateCustomerAction(
  id: string,
  input: CustomerInput
): Promise<CustomerActionResult>;
```

### 2.2 Sales Mutation Actions (`lib/sales/sale-actions.ts`)

```typescript
/**
 * Creates a new sale transaction and invalidates all inventory, sales, customer balances, and reporting caches.
 * Invalidation paths: /sales, /sales/new, /inventory, /customers, /customers/balances, /reports/balances, /dashboard
 */
export async function submitNewSale(
  input: CreateSaleInput
): Promise<CreateSaleResult>;

/**
 * Updates payment status and amount paid for an existing sale, invalidating balances and reports.
 * Invalidation paths: /sales, /sales/${saleId}, /customers, /customers/balances, /reports/balances, /dashboard
 */
export async function updateSalePaymentAction(
  input: UpdateSalePaymentInput
): Promise<UpdatePaymentResult>;
```
