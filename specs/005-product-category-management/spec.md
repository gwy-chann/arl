# Feature Specification: Product Category Management with Cascade Validation

**Feature Key**: `ARL-7`  
**Feature Slug**: `005-product-category-management`  
**Jira Story**: STORY-2.1: Product Category Management with Cascade Validation  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** create, rename, list, and delete condiment categories with live product counts and orphan warnings,  
**so that** my inventory stays logically organized without accidental loss of product classifications.

---

## 2. Business Invariants & Rules

1. **Category Entity & Attributes**:
   - Every category has a unique `id` (UUID), a human-readable `name` (text, 1-60 characters, trimmed, unique case-insensitive), `created_at` timestamp, and `updated_at` timestamp.
   - Initial condiment catalog categories: "Soy Sauce", "Vinegar", "Fish Sauce" (or custom categories such as "Specialty Blends").
2. **Product Association & Live Product Count**:
   - Products reference a category via `category_id` (foreign key pointing to `categories.id`).
   - When listing categories at `/products/categories`, each row displays the live count of actively linked products (`products.count` where `product.category_id = category.id`).
   - Newly created categories start with product count `0`.
3. **Orphan Prevention & Cascade Rules**:
   - Deleting a category with `0` linked products requires a standard confirmation prompt: `"Delete {Category Name}?"` with body `"This category is empty."`.
   - Deleting a category with `> 0` linked products requires an orphan warning confirmation prompt:
     `"Delete {Category Name}?"` with body `"{count} product{count > 1 ? 's are' : ' is'} in this category. They will become uncategorized."`.
   - Upon confirmation of deletion:
     - All linked products have their `category_id` set to `NULL` (orphaned / uncategorized), preventing accidental cascade deletion of products or past sales.
     - The category record is removed from `categories`.
     - An affirmative toast notification `"Category deleted"` is displayed for 2.8 seconds.
4. **Creation & Renaming Workflow**:
   - "Add category" opens a modal dialog titled `"Add category"` with an autofocus input for category name. Submitting saves to Supabase, displays a `"Category saved"` toast, and prepends or updates the category in the table.
   - "Rename" opens a modal dialog titled `"Rename category"` with the existing name pre-filled. Submitting updates the record in Supabase, displays `"Category saved"` toast, and refreshes the category table immediately.
5. **Real-Time Client-Side Search Filtering**:
   - The toolbar provides a search box (`Search categories`).
   - Typing into the search box dynamically filters the category list by matching the search query against category names (case-insensitive substring match).
6. **Strict Semantic Design Token Adherence**:
   - Zero hardcoded hex colors or arbitrary color brackets.
   - Table card: `bg-bg-surface border border-border rounded-[var(--r)] max-w-[640px]`.
   - Action buttons: "Rename" uses `btn sec sm` (`bg-secondary hover:bg-secondary-hover text-text-primary border border-border`), "Delete" uses `btn danger sm` (`bg-danger hover:bg-danger/90 text-text-light`).
   - Breadcrumbs: `Products` (`/products`) > `Categories` (`/products/categories`).

---

## 3. Gherkin Acceptance Criteria

### Scenario 1: Add new condiment category
```gherkin
Feature: Add Category
  Scenario: Admin creates a new condiment category
    Given an admin on "/products/categories"
    When they click "Add category"
    And enter "Specialty Blends" in the category name input
    And click "Save category"
    Then the category is persisted in Supabase
    And an affirmative toast "Category saved" is displayed
    And the category table immediately reflects the new row with product count 0
```

### Scenario 2: Rename existing category
```gherkin
Feature: Rename Category
  Scenario: Admin updates an existing category name
    Given an existing category "Soy sauce"
    When the admin clicks "Rename"
    And updates the name to "Premium Soy Sauce"
    And clicks "Save category"
    Then the database is updated in Supabase
    And an affirmative toast "Category saved" is displayed
    And the table immediately reflects the new name "Premium Soy Sauce"
```

### Scenario 3: Delete category with orphan warning check
```gherkin
Feature: Delete Category with Linked Products
  Scenario: Admin deletes a category containing linked products
    Given a category containing 3 linked products
    When the admin clicks "Delete"
    Then a confirmation modal warns: "3 products are in this category. They will become uncategorized."
    When the admin confirms deletion
    Then the category is deleted from Supabase
    And linked products have "category_id" set to NULL
    And an affirmative toast "Category deleted" is displayed
    And the category is removed from the table view
```

### Scenario 4: Delete empty category
```gherkin
Feature: Delete Empty Category
  Scenario: Admin deletes an empty category
    Given an empty category with 0 products
    When the admin clicks "Delete"
    Then a standard confirmation displays: "This category is empty."
    When the admin confirms deletion
    Then the category is deleted from Supabase without error
    And an affirmative toast "Category deleted" is displayed
    And the category is removed from the table view
```

---

## 4. UI Specification (Source of Truth: `mockup/`)

### 4.1 Header & Breadcrumbs
- **Breadcrumb path**: `Products` (`#/products`) / `Categories` (`#/products/categories`).
- **Title**: `Categories`.
- **Subtitle**: `Group products so they are easier to find.`.
- **Top action**: `<button class="btn" ...><PlusIcon />Add category</button>`.

### 4.2 Table Card Layout
- **Card**: `max-width: 640px; margin-bottom: 24px;`.
- **Toolbar**: Search box with search icon and placeholder `"Search categories"`.
- **Table Columns**:
  - `Category` (`th` left-aligned): category name rendered in bold (`<b>${name}</b>`).
  - `Products` (`th class="num"` right-aligned or centered): number of active products assigned.
  - Actions (`th` right-aligned): `Rename` (`btn sec sm`) and `Delete` (`btn danger sm`).
- **Empty state**: Clean text `"No categories found."` or empty table row when search has no matches.

### 4.3 Modal Forms
- **Add / Rename Modal**:
  - Title: `"Add category"` or `"Rename category"`.
  - Field: Label `"Category name"`, `<input id="cnm" type="text" value="..." required placeholder="e.g. Soy Sauce" />`.
  - Footer: Cancel (`btn sec`) and Submit (`btn` with text `"Save category"`).
- **Confirmation Modal**:
  - Uses `useConfirm()` from `components/ui/confirm-provider.tsx`.
  - Title: `"Delete {Category Name}?"`.
  - Message: `"{used} product{used > 1 ? 's are' : ' is'} in this category. They will become uncategorized."` (if `used > 0`), or `"This category is empty."` (if `used === 0`).
  - Confirm button: `"Delete category"`, variant: `"danger"`.
