# Quickstart & Verification Guide: Multi-Variant Product Catalog & Pricing Engine

**Feature Key**: `ARL-8`  
**Feature Slug**: `006-multi-variant-product-catalog`  
**Epic**: `EPIC-2: Core Domain Entities & Primary CRUD Operations` (`ARL-6`)  

---

## 1. Quick Verification Commands

From the worktree root (`.worktrees/ARL-8`):

```bash
# 1. Run automated unit tests
npm test

# 2. Run TypeScript compilation check
npx tsc --noEmit

# 3. Run ESLint verification
npm run lint

# 4. Start local development server
npm run dev
```

---

## 2. Interactive Browser Walkthrough Scenarios

Login to the administrative dashboard (`http://localhost:3000/products`):

### Scenario 1: Multi-variant product catalog creation
1. Navigate to `http://localhost:3000/products/new`.
2. Enter Product Name: `"Toyo"`.
3. Select Category: `"Soy sauce"`.
4. Enter size variants:
   - **350 ml**: Cost `14.00`, Selling price `20.00`, Min stock `48`, Opening stock `96`
   - **1 L**: Cost `38.00`, Selling price `50.00`, Min stock `30`, Opening stock `58`
   - **1 gal**: Cost `125.00`, Selling price `160.00`, Min stock `12`, Opening stock `17`
5. Click **"Save product"**.
6. **Expected Results**:
   - Atomic database transaction creates the product and 3 variants.
   - Redirects to `/products`.
   - Toast notification `"Product added"` is displayed.
   - The `/products` catalog table displays "Toyo" with its 3 rows.

### Scenario 2: Automatic unit profit computation
1. On `/products`, locate the row for `Toyo - 1 L` (Cost `₱38.00`, Selling price `₱50.00`).
2. Observe the "Profit each" column:
   - **Expected Result**: Displays `"₱12.00"` (`₱50.00 - ₱38.00`).

### Scenario 3: Negative price rejection
1. Navigate to `/products/new`.
2. In the Selling Price input for 350 ml, enter `-10.00`.
3. Click **"Save product"**.
4. **Expected Results**:
   - Submission is halted by Zod validation.
   - Field error displays `"Selling price must be greater than or equal to 0"`.
   - No database record is inserted.

### Scenario 4: Product deletion safeguard
1. On `/products`, locate the `"Patis"` product.
2. Click the **"Delete"** button.
3. Observe the confirmation modal:
   - Title: `"Delete Patis?"`
   - Body: `"This removes Patis and its three sizes from the product list. Past sales stay in the records."`
   - Confirm button: `"Delete product"` (danger styling).
4. Click **"Delete product"**:
   - **Expected Results**:
     - Product and its 3 variants are removed from the active catalog.
     - Toast notification `"Product deleted"` appears.
     - Past sales transactions retain line item details without corruption.

