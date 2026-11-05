# Requirements Quality Checklist: Multi-Variant Product Catalog & Pricing Engine

**Feature Key**: `ARL-8`  
**Feature Slug**: `006-multi-variant-product-catalog`  
**Jira Story**: STORY-2.2: Multi-Variant Product Catalog (Toyo, Suka, Patis) & Pricing Engine  

---

## 1. Requirement Completeness & Domain Parity

- [x] **Catalog Route (`/products`)**: Table listing all products with their 3 standard packaging sizes (`350 ml`, `1 L`, `1 gal`) in grouped rows matching the mockup.
- [x] **Multi-Variant Creation Route (`/products/new`)**: Admin form accepting product name, category selection, and 3 variant rows (cost price, selling price, minimum stock, and initial opening stock).
- [x] **Edit Product Route (`/products/[id]/edit`)**: Admin form pre-populating existing product details and variant pricing/thresholds for updates.
- [x] **Atomic Database Persistence**: Creation and updates execute as atomic operations across `products` and `product_variants`.
- [x] **Unit Profit Margin Calculation**: Automatically computes `profit = selling_price - cost_price` for each variant row in the table (e.g., ₱50.00 selling - ₱38.00 cost = ₱12.00 profit).
- [x] **Negative Price Prevention**: Zod validation halts submission and flags invalid inputs when cost or selling price is negative (e.g., `-10.00`).
- [x] **Product Deletion Safeguard**: Deleting a product triggers `useConfirm()` with warning: `"This removes {Product Name} and its three sizes from the product list. Past sales stay in the records."` and button `"Delete product"`.
- [x] **Toast Notifications**: Affirmative toasts `"Product added"`, `"Product saved"`, and `"Product deleted"` display upon state transitions.
- [x] **Live Client Search**: Toolbar search box live-filters products by product name, category name, or size label.
- [x] **Empty State Handling**: Graceful fallback UI when no products exist in the catalog.

---

## 2. Accessibility & Usability (WCAG 2.1 AA)

- [x] **Accessible Form Controls**: All inputs in the variant table have explicit labels or `aria-label` attributes (e.g. `aria-label="350 ml cost price"`).
- [x] **Confirmation Dialog Focus**: Deletion modal traps focus, supports Escape key dismissal, and sets focus appropriately.
- [x] **Numeric Alignment**: Cost, selling price, profit, and stock columns are right-aligned with tabular numeric formatting (`font-mono` or `num`).
- [x] **Clear Error Messaging**: Inline field errors highlight invalid price or stock inputs.

---

## 3. Design Tokens & Visual Hierarchy

- [x] **Zero Hardcoded Colors**: Strictly semantic tokens (`bg-bg-surface`, `bg-bg-base`, `text-text-primary`, `text-text-muted`, `border-border`, `bg-primary`, `bg-secondary`, `bg-danger`).
- [x] **Mockup Visual Parity**: Row spans for Product Name & Category and Action buttons with border dividers matching `mockup/app.js:315-343`.
- [x] **Universal Dark Mode**: Seamless visual contrast in light and dark modes via design system CSS variables.

---

## 4. Testability & Verification

- [x] **Unit Tests**: Domain logic tests covering profit calculations, Zod validation rejections, atomic data operations, and deletion prompts.
- [x] **Compilation & Linting**: `npm run build` and `npm run lint` pass without errors.
