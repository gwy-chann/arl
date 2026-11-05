# Implementation Plan: Product Category Management with Cascade Validation

**Feature Key**: `ARL-7`  
**Feature Slug**: `005-product-category-management`  

---

## 1. Architectural Boundaries & Component Hierarchy

```text
app/(admin)/products/categories/page.tsx (Server Component Entry & Data Fetcher)
└── CategoryManagementView (Client Component Orchestrator)
    ├── PageHeader (Breadcrumbs: Products > Categories, Title, "Add category" Button)
    ├── SearchToolbar (Filter categories in real-time)
    ├── CategoryTable (Renders table, live product counts, Rename & Delete action buttons)
    ├── CategoryModal (Controlled dialog for Add/Rename operations)
    └── ConfirmDialog (Via useConfirm for orphan warning & empty deletion)
```

---

## 2. Component Deliverables & Responsibilities

| File Path | Role & Purpose |
| :--- | :--- |
| `supabase/migrations/20261105000000_create_categories_table.sql` | PostgreSQL schema defining `categories` table, unique index, RLS policies, and seed data. |
| `specs/005-product-category-management/contracts/category-contracts.ts` | TypeScript types, Zod/domain validation, and confirmation message generator. |
| `lib/categories/category-service.ts` | Dual-mode domain service executing Supabase queries (with resilient in-memory fallback for offline/test environments). |
| `lib/categories/category-actions.ts` | Server actions for creating, renaming, and deleting categories with revalidation. |
| `components/categories/category-table.tsx` | Responsive table displaying category names, live product counts, and action buttons. |
| `components/categories/category-modal.tsx` | Accessible modal form for adding new categories or renaming existing ones. |
| `app/(admin)/products/categories/page.tsx` | Next.js App Router administrative page loading categories and orchestrating UI. |
| `tests/categories.test.ts` | Unit test suite validating name constraints, orphan warning messages, and CRUD operations. |

---

## 3. Design Tokens & Styling Mapping

- **Breadcrumbs**: `text-[13px] text-text-muted flex items-center gap-1.5 mb-2`
- **Table Card**: `bg-bg-surface border border-border rounded-[var(--r)] max-w-[640px] shadow-sm`
- **Toolbar**: `p-3.5 border-b border-border flex items-center justify-between`
- **Search Input**: `w-full bg-bg-base border border-border rounded-[var(--r)] px-3 py-1.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus`
- **Table Layout**:
  - `th`: `text-left text-[12.5px] uppercase font-semibold text-text-muted px-4 py-3 bg-bg-base/50`
  - `th.num` / `td.num`: `text-right tabular-nums text-text-secondary font-medium`
  - `td`: `px-4 py-3.5 border-t border-border/70 text-[14.5px] text-text-primary`
- **Buttons**:
  - Add Category: `bg-primary hover:bg-primary-hover text-text-light font-medium rounded-[var(--r)] px-3.5 py-1.5 text-[14px] flex items-center gap-1.5`
  - Rename: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border rounded-[var(--r)] px-2.5 py-1 text-[13px] font-medium flex items-center gap-1`
  - Delete: `bg-danger/10 hover:bg-danger/20 text-danger border border-danger-border/30 rounded-[var(--r)] px-2.5 py-1 text-[13px] font-medium flex items-center gap-1`

---

## 4. Test Strategy

1. **Unit Tests (`tests/categories.test.ts`)**:
   - `validateCategoryName`: Validates non-empty requirement, trim behavior, length limits.
   - `getDeleteCategoryPrompt`: Verifies exact wording for empty categories vs. categories with 1 product or 3 products.
   - `CategoryService`: Tests category creation, renaming, listing, and cascade deletion.
2. **End-to-End Walkthrough**:
   - Verification of all 4 Jira acceptance criteria in the browser at `/products/categories`.
