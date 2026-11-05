# Implementation Plan: Multi-Variant Product Catalog & Pricing Engine

**Feature Key**: `ARL-8`  
**Feature Slug**: `006-multi-variant-product-catalog`  
**Epic**: `EPIC-2: Core Domain Entities & Primary CRUD Operations` (`ARL-6`)  

---

## 1. Architectural Boundaries & Component Hierarchy

```text
app/(admin)/products/page.tsx (Server Component Entry & Data Fetcher)
└── ProductCatalogView (Client Component Orchestrator)
    ├── PageHeader (Title "Products", subtitle, "Add product" Button)
    ├── SearchToolbar (Real-time filtering by product name, category, or size)
    ├── ProductTable (Grouped rows per product with rowSpan="3" for product/actions, formatted ₱ prices, profit each, stock)
    └── ConfirmDialog (Via useConfirm for deletion safeguard prompt)

app/(admin)/products/new/page.tsx (Product Creation Page)
└── ProductForm (Form Component with Product Name, Category dropdown, and 3-variant pricing/stock table)

app/(admin)/products/[id]/edit/page.tsx (Product Edit Page)
└── ProductForm (Form Component pre-populated with existing product and variant data)
```

---

## 2. Component Deliverables & Responsibilities

| File Path | Role & Purpose |
| :--- | :--- |
| `supabase/migrations/20261105010000_create_products_and_variants_tables.sql` | PostgreSQL schema defining `products` and `product_variants` tables, constraints, foreign keys, RLS, and seed data. |
| `specs/006-multi-variant-product-catalog/contracts/product-contracts.ts` | TypeScript interfaces, Zod validation schemas (`productInputSchema`, `variantInputSchema`), `computeUnitProfit`, and deletion safeguard prompt. |
| `lib/products/product-service.ts` | Dual-mode domain service executing Supabase queries (with resilient in-memory fallback for offline/test environments). |
| `lib/products/product-actions.ts` | Server actions for creating, updating, and deleting products with variants, and fetching products/categories. |
| `components/products/product-table.tsx` | Responsive table displaying multi-variant product catalog with row spans, unit profit computation, and action controls. |
| `components/products/product-form.tsx` | Multi-variant product form supporting creation and editing with Zod validation. |
| `app/(admin)/products/page.tsx` | Main products catalog page route. |
| `app/(admin)/products/new/page.tsx` | Product creation route. |
| `app/(admin)/products/[id]/edit/page.tsx` | Product edit route. |
| `tests/products.test.ts` | Unit test suite validating profit calculation, Zod validation rejection of negative values, atomic operations, and deletion safeguard prompts. |

---

## 3. Design Tokens & Styling Mapping

- **Zero Hardcoded Colors**: Strictly semantic tokens (`bg-bg-surface`, `bg-bg-base`, `text-text-primary`, `text-text-muted`, `border-border`, `bg-primary`, `bg-secondary`, `bg-danger`).
- **Catalog Table Card**: `bg-bg-surface border border-border rounded-[var(--r)] shadow-sm overflow-hidden`
- **Product Rowspan Cell**: `p-3.5 align-middle border-r border-border font-semibold text-text-primary`
- **Actions Cell**: `p-3.5 align-middle text-right whitespace-nowrap`
- **Unit Profit Cell**: `tabular-nums text-right text-text-primary font-medium`
- **Variant Table Form**: `border border-border rounded-[var(--r)] overflow-hidden w-full text-left`

---

## 4. Test Strategy

1. **Unit Tests (`tests/products.test.ts`)**:
   - `computeUnitProfit`: Tests unit profit calculations (`₱50.00 - ₱38.00 = ₱12.00`).
   - `variantInputSchema` / `productInputSchema`: Verifies rejection of negative cost price, negative selling price, missing names, or invalid sizes.
   - `getDeleteProductPrompt`: Validates confirmation dialog title, body, and button labels.
   - `ProductService`: Tests atomic creation of product + 3 variants, updates, listing, search filtering, and deletion.
2. **Typecheck & Linter**:
   - Run `npx tsc --noEmit` and `npm run lint` to guarantee clean compilation.

