# Technical Research & Architecture Decisions: Multi-Variant Product Catalog & Pricing Engine

**Feature Key**: `ARL-8`  
**Feature Slug**: `006-multi-variant-product-catalog`  
**Epic**: `EPIC-2: Core Domain Entities & Primary CRUD Operations` (`ARL-6`)  

---

## 1. Stack Alignment & Context

- **Framework**: Next.js 16 (App Router) with React 19.
- **Database & Auth**: Supabase PostgreSQL with SSR authentication (`@supabase/ssr`).
- **Styling**: Tailwind CSS v4 using semantic design tokens (`lib/tokens.ts`, `app/globals.css`).
- **Validation**: Zod schema validation ensuring non-negative price and quantity constraints.
- **UI Components**: Native `useConfirm()` (`components/ui/confirm-provider.tsx`), `useToast()` (`components/ui/toast-provider.tsx`), and responsive layout shell.
- **Target Application**: ARLQ Food Condiments Trading (Toyo, Suka, Patis inventory & sales system).

---

## 2. Architectural Analysis & Decisions

### Decision 1: Relational Schema Design (Products & Product Variants)
- **Problem**: In ARLQ, each product (e.g. Toyo) is sold in three distinct sizes (`350ml`, `1L`, `1gal`). Each packaging size carries its own cost price, selling price, current stock quantity, and minimum stock threshold. Future POS sales and inventory movements record transactions against specific variant IDs, not arbitrary text strings.
- **Decision**:
  - Implement two normalized relational tables in PostgreSQL:
    1. `public.products`:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `name TEXT NOT NULL`
       - `category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL`
       - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
       - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
    2. `public.product_variants`:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE`
       - `size TEXT NOT NULL CHECK (size IN ('350', '1L', 'gal'))`
       - `cost_price NUMERIC(10, 2) NOT NULL CHECK (cost_price >= 0)`
       - `selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0)`
       - `stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)`
       - `min_stock_level INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0)`
       - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
       - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
       - `CONSTRAINT uq_product_size UNIQUE (product_id, size)`
  - This guarantees relational integrity: cascading deletion from a product automatically removes its variants, while deleting a category sets `category_id = NULL` without deleting products.

### Decision 2: Atomic Transactions & RPC Helper
- **Problem**: Creating or updating a product requires inserting or updating 1 product record and 3 variant records simultaneously. If an insert fails halfway, partial orphaned records must not corrupt the catalog.
- **Decision**:
  - Implement an atomic PostgreSQL function / procedure or transactional server action:
    ```sql
    CREATE OR REPLACE FUNCTION public.create_product_with_variants(
        p_name TEXT,
        p_category_id UUID,
        p_variants JSONB
    ) RETURNS JSONB ...
    ```
  - In TypeScript service layer, wrap operations with transactional safety and structured error handling.

### Decision 3: Unit Profit Computation & Formatting
- **Problem**: Acceptance criteria scenario 2 dictates automatic computation of unit profit margin (`price - cost`).
- **Decision**:
  - Compute unit profit as `unit_profit = selling_price - cost_price`.
  - Format monetary values with standard Philippine Peso currency prefix: `₱` + two decimals (`peso(amount)` utility conforming to `mockup/app.js`).
  - Unit profit calculation is implemented both in TypeScript domain logic (for API/DTOs) and as an explicit column in the UI table.

### Decision 4: Zod Validation & Error Handling
- **Problem**: Acceptance criteria scenario 3 requires negative price inputs (e.g. `-10.00`) to be halted by Zod validation with clear error messages.
- **Decision**:
  - Install and define Zod schemas:
    ```typescript
    export const variantInputSchema = z.object({
      size: z.enum(['350', '1L', 'gal']),
      cost_price: z.number().min(0, "Cost price must be greater than or equal to 0"),
      selling_price: z.number().min(0, "Selling price must be greater than or equal to 0"),
      min_stock_level: z.number().int().min(0, "Minimum stock must be 0 or greater"),
      opening_stock: z.number().int().min(0, "Opening stock must be 0 or greater").optional(),
    });
    ```
  - Validate on the client before submit and in the server action before DB mutation.

### Decision 5: Resilient Offline / In-Memory Mock Store
- **Problem**: Like ARL-7 (categories), automated tests and environments without live Supabase instances need consistent in-memory fallbacks seeded with ARLQ's canonical 3 products (Toyo, Suka, Patis) and 9 variants.
- **Decision**:
  - Provide an in-memory repository store in `lib/products/product-service.ts` matching `mockup/app.js` baseline seed.
  - When Supabase client encounters connection errors or is unconfigured, fall back seamlessly to the in-memory store so CI tests and offline operations run smoothly without external network dependencies.

