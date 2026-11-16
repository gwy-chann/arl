# Requirements Quality Checklist: Read-Only Database Grounding Tools

**Feature Key**: `ARL-32`  
**Feature Slug**: `017-read-only-database-grounding-tools`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Functional Completeness & Grounding Scope

- [x] **Clear Persona & Value**: ARLQ store administrator requires verifiable, zero-hallucination inventory, sales, and debt figures.
- [x] **Tool 1 (`getInventorySummary`)**:
  - [x] Supports optional `searchQuery` (filtering by product name or condiment).
  - [x] Supports optional `lowStockOnly` (filtering items where `stockQuantity <= minStockLevel`).
  - [x] Returns item list with packaging sizes (`350 ml`, `1 L`, `1 gal`), unit prices, cost prices, current stock, and threshold warnings.
  - [x] Returns `totalVariants` and `lowStockCount` aggregates.
- [x] **Tool 2 (`getSalesOverview`)**:
  - [x] Requires `timeframe` parameter with enum: `'today' | 'yesterday' | 'last_7_days' | 'current_month' | 'all'`.
  - [x] Computes total transaction count, gross revenue, cash collected, and outstanding balance.
  - [x] Provides payment status breakdown (`paidCount`, `partiallyPaidCount`, `notPaidCount`).
  - [x] Adheres to `Asia/Manila` (UTC+8) calendar timezone boundaries.
- [x] **Tool 3 (`getCustomerBalances`)**:
  - [x] Supports optional `overdueOnly` boolean flag.
  - [x] Supports optional partial `customerName` string filter.
  - [x] Returns indebted customer list with phone, total debt, unpaid invoice count, oldest invoice age in days, and overdue flag.
  - [x] Returns `totalIndebtedCustomers` and `totalOutstandingDebt`.
- [x] **Tool 4 (`getStoreSettings`)**:
  - [x] Returns default overdue reminder threshold days (default 7 days).
  - [x] Returns notification phone and store metadata.
- [x] **Strict Read-Only Enforcement**:
  - [x] Zero tool declarations or database mutations for create, update, delete, or drop operations.
  - [x] Safe parameter parsing with Zod schemas to eliminate injection vectors.
- [x] **Missing Entity Handling**:
  - [x] Non-existent products or customers return empty arrays without throwing errors or hallucinating facts.

---

## 2. Localization & Formatting Standards

- [x] **Philippine Peso Formatting**: All monetary representations use `₱` symbol with comma thousand separators and 2 decimal places (e.g. `₱1,250.00`).
- [x] **Condiment Packaging Standardization**: Product sizes consistently normalized to `350 ml`, `1 L`, `1 gal`.
- [x] **Zero Emoji Enforcement**: System messages, tool outputs, and responses contain zero emojis.

---

## 3. Resilience & Integration Verification

- [x] **Dual Runtime Support**: Direct Supabase client queries when credentials are present; seamless fallback to in-memory domain stores during offline execution or unit testing.
- [x] **Downstream Readiness**: Fully compatible with `ARL-31` (suggested prompts) and `ARL-33` (persona system prompt & refusal guardrails).
- [x] **Type Safety**: Strictly typed TypeScript interfaces and Zod validation schemas for all tool inputs and outputs.
