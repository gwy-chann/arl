# Requirements Quality Checklist: Product Category Management with Cascade Validation

**Feature Key**: `ARL-7`  
**Feature Slug**: `005-product-category-management`  

---

## 1. Requirement Completeness & Parity

- [x] **Category Management Route**: `/products/categories` page rendered under the authenticated admin layout shell.
- [x] **Add Category Flow**: Clicking "Add category" opens a modal dialog, accepts a non-empty name, persists to Supabase, shows "Category saved" toast, and displays the new category with product count 0.
- [x] **Rename Category Flow**: Clicking "Rename" opens a modal dialog with prefilled name, updates in Supabase, shows "Category saved" toast, and immediately updates the row in the table.
- [x] **Orphan Warning Check**: Deleting a category with linked products (`product_count > 0`) displays a warning modal: `"{count} product{s are / is} in this category. They will become uncategorized."`.
- [x] **Cascade NULL Orphan Handling**: On confirming deletion, linked products have their `category_id` set to `NULL` (uncategorized) without losing product or sales history.
- [x] **Empty Category Deletion**: Deleting a category with 0 linked products displays confirmation: `"This category is empty."`, deleting without error.
- [x] **Toast Notifications**: Affirmative toasts `"Category saved"` and `"Category deleted"` fire with 2.8s auto-dismissal.
- [x] **Real-Time Client Search**: Search toolbar dynamically filters categories in the table matching user input.

---

## 2. Accessibility & Usability (WCAG 2.1 AA)

- [x] **Modal Dialog Focus Trap**: Add/Rename modals trap keyboard focus, autofocus category name input, and close cleanly on Escape or backdrop click.
- [x] **Confirmation Dialog Integration**: Uses `useConfirm()` with danger variant for destructive deletions.
- [x] **Keyboard Navigation**: Buttons, table rows, and form controls are fully focusable and operable via standard keyboard navigation.
- [x] **Screen Reader Semantics**: Accessible table headers (`th scope="col"`), numeric alignment, and descriptive button labels.

---

## 3. Design Tokens & Visual Hierarchy

- [x] **Zero Hardcoded Colors**: Strictly semantic Tailwind CSS tokens (`bg-bg-surface`, `border-border`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-primary`, `bg-secondary`, `bg-danger`).
- [x] **Mockup Parity**: Conforms to `mockup/index.html` and `mockup/app.js:345-349` for table card width (`max-w-[640px]`), toolbar, and buttons.
- [x] **Light/Dark Mode Cohesion**: Automatically looks crisp in light theme and adapts in dark theme via CSS variables.

---

## 4. Testability & Verification

- [x] **Automated Unit Tests**: Unit tests covering name validation, orphan warning phrasing logic, CRUD operations, and cascade foreign key behavior.
- [x] **Interactive Browser Verification**: Walkthrough scenarios covering all 4 Jira acceptance criteria.
