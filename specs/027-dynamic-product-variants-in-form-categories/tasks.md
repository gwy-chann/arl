# Implementation Tasks: In-Form Category Creation & Dynamic Product Variant Management

**Feature Key**: `ARL-38`  
**Feature Slug**: `027-dynamic-product-variants-in-form-categories`  
**Jira Story**: STORY-2.5: In-Form Category Creation & Dynamic Product Variant Management  

---

## Phase 1: Tooling & Schema Migrations (Units 1 & 2)

- [ ] `T-101`: Create `supabase/migrations/20261119000000_allow_dynamic_product_variants.sql` dropping `product_variants_size_check` and enforcing `CHECK (trim(size) <> '')`.
- [ ] `T-102`: Apply the migration to the local Supabase instance using `npx supabase db push` or SQL execution.

---

## Phase 2: Contracts, Domain Service & Unit Tests (Units 2 & 3)

- [ ] `T-201`: Update contracts in `specs/006-multi-variant-product-catalog/contracts/product-contracts.ts` and `specs/027-dynamic-product-variants-in-form-categories/contracts/product-contracts.ts` to allow dynamic `size: string`, `variants.min(1)`, and duplicate size `.refine()` validation.
- [ ] `T-202`: Update `lib/products/product-service.ts` to support dynamic variant creation (variable array length >= 1) and dynamic variant upserts/insertions in `updateProduct` for both Supabase client and in-memory fallback.
- [ ] `T-203`: Author unit tests in `tests/dynamic-product-variants.test.ts` testing dynamic sizes, duplicate size rejection, variable variant counts, and inline category creation integration.
- [ ] `T-204`: Run `npm test tests/dynamic-product-variants.test.ts` to confirm test behavior (TDD cycle).

---

## Phase 3: UI Components & Form Enhancements (Units 4 & 5)

- [ ] `T-301`: Update `components/products/product-form.tsx` to include an accessible inline category creation modal triggered by "+ Add new category" with instant dropdown update, preselection, and preservation of unsaved form state.
- [ ] `T-302`: Update `components/products/product-form.tsx` variants section to support dynamic addition of variant rows ("+ Add size variant"), removal of variant rows, editable custom size labels, and client-side duplicate size validation.
- [ ] `T-303`: Update `components/products/product-table.tsx` to dynamically set `rowSpan={product.variants.length || 1}` instead of hardcoded `3`, ensuring products with any number of variants render cleanly.

---

## Phase 4: Verification, Convergence & Atomic Commits (Unit 6 & PR)

- [ ] `T-401`: Run full test suite (`npm test`) and type checking (`npx tsc --noEmit`) inside the worktree.
- [ ] `T-402`: Execute atomic commits following `.agents/rules/atomic-commit.md`.
- [ ] `T-403`: Push branch `feat/ARL-38-dynamic-product-variants` and open Pull Request following `create-pr` skill.
