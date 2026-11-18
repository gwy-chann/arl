# Technical Implementation Plan: In-Form Category Creation & Dynamic Product Variant Management

**Feature Key**: `ARL-38`  
**Feature Slug**: `027-dynamic-product-variants-in-form-categories`  
**Jira Story**: STORY-2.5: In-Form Category Creation & Dynamic Product Variant Management  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  
**Status**: Ready for Implementation  

---

## 1. Technical Scope & Architecture Overview

This feature eliminates the rigid 3-variant constraint on products and the friction of navigating away to create categories:
1. **Database Relaxation**: Drop `CHECK (size IN ('350', '1L', 'gal'))` and add `CHECK (trim(size) <> '')`. Maintain `UNIQUE(product_id, size)`.
2. **Contract Update**: Update Zod schemas in `specs/006-multi-variant-product-catalog/contracts/product-contracts.ts` and `specs/027-dynamic-product-variants-in-form-categories/contracts/product-contracts.ts` allowing dynamic string sizes, length >= 1, and duplicate size rejection.
3. **Domain Service Enhancements**: Update `ProductService` (`lib/products/product-service.ts`) to support dynamic insert/update/upsert of variant rows when updating products, plus in-memory fallback.
4. **Server Actions**: Ensure `createProductAction` and `updateProductAction` in `lib/products/product-actions.ts` accept dynamic variants. Revalidate `/products`, `/products/new`, `/products/[id]/edit`, `/sales/new`, `/inventory`.
5. **UI Form Components**:
   - Update `components/products/product-form.tsx` to:
     - Add inline category modal triggered by "+ Add new category".
     - Enable adding new variant rows via "+ Add size variant".
     - Enable removing variant rows (when rows > 1).
     - Allow editing custom size labels in row inputs or dropdown presets with custom override.
     - Validate unique variant sizes client-side before submission.
6. **Downstream UI Adaptations**: Ensure `components/products/product-table.tsx` cleanly handles variable row spans and custom sizes.

---

## 2. File & Component Boundary Map

| Layer | File Path | Scope of Modification |
| :--- | :--- | :--- |
| **Database** | `supabase/migrations/20261119000000_allow_dynamic_product_variants.sql` | Drop size enum check, add non-empty check, add index. |
| **Contracts** | `specs/006-multi-variant-product-catalog/contracts/product-contracts.ts` & `specs/027-dynamic-product-variants-in-form-categories/contracts/product-contracts.ts` | Relax `variantInputSchema.size` to string, `productInputSchema.variants` to `.min(1)` with uniqueness `.refine()`. |
| **Domain Logic** | `lib/products/product-service.ts` | Dynamic variant insertions, upserts on update, in-memory sync, fallback handling. |
| **Actions** | `lib/products/product-actions.ts` | Ensure actions accept dynamic variant input and revalidate paths. |
| **UI Components** | `components/products/product-form.tsx` | Inline category dialog modal, dynamic variant row addition/deletion, editable size labels. |
| **Catalog UI** | `components/products/product-table.tsx` | Dynamic `rowSpan={product.variants.length}` support for variable variant counts. |
| **Tests** | `tests/dynamic-product-variants.test.ts` | Unit tests for Zod schemas, duplicate rejection, service CRUD, and inline category creation. |

---

## 3. Detailed Implementation Units

### Unit 1: Database Migration
- Migration `20261119000000_allow_dynamic_product_variants.sql`:
  - `ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_size_check;`
  - `ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_size_not_empty CHECK (trim(size) <> '');`
  - Ensure `uq_product_variant_size` is active.

### Unit 2: Schema & Contracts
- Update `specs/006-multi-variant-product-catalog/contracts/product-contracts.ts` and `specs/027-dynamic-product-variants-in-form-categories/contracts/product-contracts.ts`:
  - Support arbitrary string sizes (max 50 chars).
  - Support `variants.min(1)`.
  - Add `.refine()` preventing duplicate size labels for the same product.

### Unit 3: Service Layer
- In `lib/products/product-service.ts`:
  - `createProduct`: map any number of variants (validated.variants.length >= 1).
  - `updateProduct`:
    - Fetch existing variants.
    - Upsert/insert incoming variants.
    - Delete any variants that were removed in the form if they have no referencing sales items.
    - Mirror logic in `inMemoryProducts`.

### Unit 4: Product Form & Inline Category Modal
- In `components/products/product-form.tsx`:
  - Category selector: add "+ Add new category" button next to `<select id="pc">`.
  - Render inline accessible modal dialog (`role="dialog"`, `aria-modal="true"`) when modal state is active.
  - Submitting category calls `createCategoryAction(name)`. On success, appends to `categories` state, selects the new ID, toasts "Category added", preserves all existing form inputs.
  - Variants table:
    - Allow adding variant rows via "+ Add size variant".
    - Allow removing variant rows (when rows count > 1).
    - Allow custom size entry (text input or preset selection + custom text).
    - Dynamic rowSpan support in table.

### Unit 5: Product Table Dynamic RowSpan
- In `components/products/product-table.tsx`:
  - Calculate `rowSpan={p.variants.length || 1}` instead of hardcoded `rowSpan={3}`.
  - Support products with 1, 2, 4, or more variants gracefully.

### Unit 6: Automated Unit & Integration Tests
- In `tests/dynamic-product-variants.test.ts`:
  - Verify Zod schema accepts 1, 2, 4+ variants.
  - Verify Zod schema rejects duplicate size labels (case-insensitive).
  - Verify `ProductService` creates product with custom size variants ("500 ml", "20 L").
  - Verify `ProductService` adds variant to existing product on update.
  - Verify `createCategoryAction` integrates seamlessly.
