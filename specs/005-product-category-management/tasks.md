# Implementation Tasks: Product Category Management with Cascade Validation

**Feature Key**: `ARL-7`  
**Feature Slug**: `005-product-category-management`  

---

## Phase 1: Database Migration & Schema

- [ ] `T-101`: Create `supabase/migrations/20261105000000_create_categories_table.sql` defining `categories` table, case-insensitive uniqueness index, RLS policies for authenticated administrators, and baseline seed data ("Soy Sauce", "Vinegar", "Fish Sauce").

---

## Phase 2: Contracts, Domain Service & Unit Tests

- [ ] `T-201`: Create `specs/005-product-category-management/contracts/category-contracts.ts` with TypeScript interfaces (`Category`, `CategoryWithProductCount`), `validateCategoryName`, and `getDeleteCategoryPrompt`.
- [ ] `T-202`: Create `lib/categories/category-service.ts` providing CRUD operations (`getCategories`, `createCategory`, `renameCategory`, `deleteCategory`) with Supabase client support and resilient offline/in-memory fallback.
- [ ] `T-203`: Create `tests/categories.test.ts` covering category name validation, orphan warning confirmation phrasing, and CRUD operations with cascade orphan handling.
- [ ] `T-204`: Run `npm test` verifying unit tests pass.

---

## Phase 3: Server Actions & Category UI Components

- [ ] `T-301`: Create `lib/categories/category-actions.ts` exposing Next.js Server Actions for category mutations with revalidation.
- [ ] `T-302`: Create `components/categories/category-modal.tsx` supporting Add and Rename modal workflows using the shared `Modal` component, input auto-focus, and loading states.
- [ ] `T-303`: Create `components/categories/category-table.tsx` with search filtering, live product count columns, Rename triggers, and Delete confirmation prompts using `useConfirm()`.
- [ ] `T-304`: Create `app/(admin)/products/categories/page.tsx` rendering the full category management view at `/products/categories`.

---

## Phase 4: Verification, Convergence & Atomic Commits

- [ ] `T-401`: Run `npm test` to verify all test suites pass.
- [ ] `T-402`: Run `npx tsc --noEmit` and `npm run lint` to guarantee zero compilation and linting errors.
- [ ] `T-403`: Execute atomic commits following `.agents/rules/atomic-commit.md`.
- [ ] `T-404`: Push branch and open Pull Request following `create-pr` skill.
