# Implementation Tasks: Multi-Variant Product Catalog & Pricing Engine

**Feature Key**: `ARL-8`  
**Feature Slug**: `006-multi-variant-product-catalog`  
**Jira Story**: STORY-2.2: Multi-Variant Product Catalog (Toyo, Suka, Patis) & Pricing Engine  

---

## Phase 1: Tooling & Schema Migrations (Units 2 & 3)

- [x] `T-101`: Add `zod` to `package.json` dependencies and run `npm install` inside the worktree if needed.
- [x] `T-102`: Create `supabase/migrations/20261105010000_create_products_and_variants_tables.sql` defining `products` and `product_variants` tables, foreign keys, non-negative check constraints, RLS policies, and baseline seed data (Toyo, Suka, Patis across 350ml, 1L, 1gal).

---

## Phase 2: Contracts, Domain Service & Unit Tests (Unit 4)

- [x] `T-201`: Create `specs/006-multi-variant-product-catalog/contracts/product-contracts.ts` with TypeScript types, Zod schemas (`productInputSchema`, `variantInputSchema`), `computeUnitProfit`, and `getDeleteProductPrompt`.
- [x] `T-202`: Create `lib/products/product-service.ts` providing CRUD operations (`getProducts`, `getProductById`, `createProductWithVariants`, `updateProductWithVariants`, `deleteProduct`) with Supabase client support and resilient offline/in-memory fallback matching the mockup baseline.
- [x] `T-203`: Create `tests/products.test.ts` covering profit calculation, Zod validation rejection of negative values, atomic multi-variant creation/updating, and deletion safeguard prompts.
- [x] `T-204`: Run `npm test` verifying that the unit tests pass.

---

## Phase 3: Server Actions, UI Components & Routes (Unit 5)

- [x] `T-301`: Create `lib/products/product-actions.ts` exposing Server Actions for creating, updating, and deleting products with variants, with Next.js path revalidation.
- [x] `T-302`: Create `components/products/product-table.tsx` with live search filtering, grouped rows with `rowSpan="3"` for product name/category and actions, formatted Peso prices, profit each computation, and delete confirmation prompt using `useConfirm()`.
- [x] `T-303`: Create `components/products/product-form.tsx` supporting product creation and editing with product name, category dropdown, and 3-variant inputs table with Zod validation.
- [x] `T-304`: Replace placeholder in `app/(admin)/products/page.tsx` with the live product catalog view.
- [x] `T-305`: Create `app/(admin)/products/new/page.tsx` rendering the product creation form.
- [x] `T-306`: Create `app/(admin)/products/[id]/edit/page.tsx` rendering the product edit form.

---

## Phase 4: Verification, Convergence & Atomic Commits (Unit 6 & PR)

- [x] `T-401`: Run `npm test` to verify all test suites pass.
- [x] `T-402`: Run `npx tsc --noEmit` and `npm run lint` to guarantee zero compilation and linting errors.
- [x] `T-403`: Execute atomic commits following `.agents/rules/atomic-commit.md`.
- [x] `T-404`: Push branch and open Pull Request following `create-pr` skill.
