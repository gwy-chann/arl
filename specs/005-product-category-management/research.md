# Technical Research & Architecture Decisions: Product Category Management with Cascade Validation

**Feature Key**: `ARL-7`  
**Feature Slug**: `005-product-category-management`  
**Epic**: `EPIC-2: Core Domain Entities & Primary CRUD Operations` (`ARL-6`)  

---

## 1. Stack Alignment & Context

- **Framework**: Next.js 16 (App Router) with React 19.
- **Database & Auth**: Supabase PostgreSQL with SSR authentication (`@supabase/ssr`).
- **Styling**: Tailwind CSS v4 using semantic design tokens (`lib/tokens.ts`, `app/globals.css`).
- **UI Components**: Native `Modal` (`components/ui/modal.tsx`), `useConfirm()` (`components/ui/confirm-provider.tsx`), `useToast()` (`components/ui/toast-provider.tsx`).
- **Target Application**: ARLQ Food Condiments Trading (Toyo, Suka, Patis inventory & sales system).

---

## 2. Architectural Analysis & Decisions

### Decision 1: Database Schema & Cascade Semantics
- **Problem**: When an administrator deletes a category, products linked to that category must not be accidentally deleted, nor should foreign key constraint errors (`violates foreign key constraint`) crash the application.
- **Decision**:
  - In PostgreSQL, create the `categories` table with:
    ```sql
    CREATE TABLE IF NOT EXISTS public.categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ```
  - For the `products` table (ARL-8), define foreign key:
    `category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL`.
  - When `categories` row is deleted, PostgreSQL automatically executes `ON DELETE SET NULL`, setting `category_id` of linked products to `NULL` (uncategorized).
  - In application server actions, before performing deletion, query the count of products where `category_id = id` to validate and display the orphan warning prompt. If confirmed, issue the delete command.

### Decision 2: Querying Live Product Counts
- **Problem**: Table view needs live product count alongside each category (`Products: 3`, `Products: 0`).
- **Decision**:
  - Execute a relational aggregation query or left join in Supabase:
    ```sql
    SELECT c.id, c.name, c.created_at, c.updated_at,
           COUNT(p.id)::int AS product_count
    FROM public.categories c
    LEFT JOIN public.products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC;
    ```
  - Return typed DTO `CategoryWithProductCount` containing `{ id, name, product_count, created_at, updated_at }`.

### Decision 3: Resilient Offline / Mock Fallback
- **Problem**: Automated CI test environments and local development without active Docker/Supabase containers require robust fallback mechanisms so unit tests and UI rendering do not crash on missing network connections.
- **Decision**:
  - Implement a dual-mode data layer in `lib/categories/category-service.ts`:
    - When Supabase client responds successfully, execute standard database queries.
    - Provide an in-memory/mock state initialized with the canonical baseline categories from the ARLQ mockup ("Soy Sauce", "Vinegar", "Fish Sauce") with realistic mock product links.
    - If Supabase returns connection refused or is unconfigured, seamlessly operate against the fallback store, ensuring `npm test`, interactive showcases, and offline previews succeed 100%.

### Decision 4: Confirmation Prompt Phrasing & Parity
- **Problem**: Scenario 3 and Scenario 4 specify exact confirmation messages depending on whether products are linked.
- **Decision**:
  - Formulate confirmation prompt helper:
    ```typescript
    export function getDeleteCategoryPrompt(name: string, productCount: number) {
      const title = `Delete ${name}?`;
      const message = productCount > 0
        ? `${productCount} product${productCount > 1 ? 's are' : ' is'} in this category. They will become uncategorized.`
        : 'This category is empty.';
      return { title, message };
    }
    ```
  - Directly invoke `useConfirm().confirm({ title, message, confirmLabel: 'Delete category', variant: 'danger' })`.

### Decision 5: Real-Time Instant Filtering
- **Problem**: Admin needs to quickly find categories in a growing list without server-side round-trip latency.
- **Decision**:
  - Maintain category list in client state with real-time substring filtering based on search query (`category.name.toLowerCase().includes(query.toLowerCase())`).
  - Search input conforms to mockup design with search icon and placeholder `"Search categories"`.
