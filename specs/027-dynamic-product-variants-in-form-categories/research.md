# Technical Research & Architecture Decisions: In-Form Category Creation & Dynamic Product Variant Management

**Feature Key**: `ARL-38`  
**Feature Slug**: `027-dynamic-product-variants-in-form-categories`  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  

---

## 1. Stack Alignment & Constraints

- **Framework**: Next.js 16 (App Router) with React 19 Client/Server components.
- **Database & Auth**: Supabase PostgreSQL with SSR authentication (`@supabase/ssr`).
- **Styling**: Tailwind CSS v4 using semantic design tokens (`lib/tokens.ts`, `app/globals.css`).
- **Validation**: Zod schema validation for variant arrays, dynamic size strings, and duplicate detection.
- **Existing Contracts**: `specs/006-multi-variant-product-catalog/contracts/product-contracts.ts` (extended or adapted for dynamic variants).

---

## 2. Architectural Analysis & Key Decisions

### Decision 1: Database Check Constraint Relaxation
- **Current State**:
  In `supabase/migrations/20261105010000_create_products_and_variants_tables.sql`, the `product_variants` table defines:
  ```sql
  size TEXT NOT NULL CHECK (size IN ('350', '1L', 'gal'))
  ```
- **Problem**:
  Any insertion or update with custom sizes like `500ml`, `20L`, or `sachet` fails with a check constraint violation error `product_variants_size_check`.
- **Decision**:
  Create migration `20261119000000_allow_dynamic_product_variants.sql` that executes:
  ```sql
  ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_size_check;
  -- Add a non-empty string check instead
  ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_size_not_empty CHECK (trim(size) <> '');
  ```
  The unique constraint `uq_product_variant_size UNIQUE (product_id, size)` is retained, preventing accidental duplicate packaging labels within the same product.

---

### Decision 2: Zod Contract Relaxation & Refinements
- **Current State**:
  `variantInputSchema` uses `z.enum(['350', '1L', 'gal'])`.
  `productInputSchema` uses `.length(3, 'Each product must have exactly 3 size variants...')`.
- **Decision**:
  1. `variantInputSchema`:
     ```ts
     size: z.string().trim().min(1, 'Variant size label is required').max(50, 'Size label must not exceed 50 characters')
     ```
  2. `productInputSchema`:
     ```ts
     variants: z.array(variantInputSchema)
       .min(1, 'Each product must have at least one variant')
       .refine((items) => {
         const sizes = items.map((i) => i.size.trim().toLowerCase());
         return new Set(sizes).size === sizes.length;
       }, {
         message: 'Variant sizes must be unique for each product',
         path: ['variants'],
       })
     ```
  3. Size Label Helper (`getSizeLabel`):
     Already supports custom sizes:
     ```ts
     export function getSizeLabel(sizeKey: string): string {
       const match = PRODUCT_SIZES.find((s) => s.key === sizeKey);
       return match ? match.label : sizeKey;
     }
     ```
     When a custom size like "500 ml" or "20 L" is stored, `getSizeLabel` returns the string as-is.

---

### Decision 3: Service-Level Dynamic Variant Sync in `ProductService`
- **Current State**:
  `updateProduct` loops over `validated.variants` and runs `.update().eq('product_id', input.id).eq('size', v.size)`. This does not support adding brand new variants to an existing product or removing variants.
- **Decision**:
  In `updateProduct`:
  1. Query existing variants for `product_id`.
  2. Compare incoming variants against existing variants by `size`:
     - **Update**: Variants whose `size` matches an existing row are updated (`cost_price`, `selling_price`, `min_stock_level`).
     - **Insert**: Variants whose `size` does not exist in the database are inserted (`product_id`, `size`, `cost_price`, `selling_price`, `min_stock_level`, `stock_quantity: v.opening_stock ?? 0`).
     - **Delete** (if removed in UI): Variants present in the database but absent in incoming `variants` can be safely removed if no `sale_items` reference them, or soft-handled. For maximum safety and historical integrity, if a variant has existing sales records, deletion is blocked or warned; otherwise unused removed variants can be pruned.
  3. Apply the same logic to the in-memory fallback store (`inMemoryProducts`) so offline mode and tests work identically.

---

### Decision 4: In-Form Inline Category Creation UX & Architecture
- **Problem**:
  Users creating a new product previously had to abandon the page to `/products/categories` if their target category did not exist.
- **Decision**:
  - Implement an accessible inline dialog / modal triggered by "+ Add new category" right next to the Category dropdown in `components/products/product-form.tsx`.
  - The modal collects `name` (string, 1-100 chars).
  - On confirm, calls `createCategoryAction(name)`.
  - On success:
    1. Appends the new category `{ id, name }` to local `categories` state.
    2. Automatically updates `categoryId` state to the new category's ID.
    3. Closes modal and triggers toast `"Category added"`.
    4. Crucially: preserves all other entered state in `name` and `variants` without page reload or loss of unsaved changes.
  - On failure: Displays the specific error (e.g., "Category name already exists") inside the modal dialog without closing it.

---

### Decision 5: Design Tokens & Accessibility Compliance
- **Rule**: Follow `AGENTS.md` - ZERO hardcoded colors.
- Use `bg-bg-surface`, `bg-bg-base`, `text-text-primary`, `border-border`, `bg-primary`, `hover:bg-primary-hover`, `text-danger`, etc.
- Modal dialog: Includes `role="dialog"`, `aria-modal="true"`, focus trap on open, keyboard Escape handler to close, and clear labels for screen readers.
