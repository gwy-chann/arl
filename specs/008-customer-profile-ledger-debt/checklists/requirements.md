# Requirements Quality Checklist: Customer Profile View with Purchase Ledger & Debt Breakdown

**Feature Key**: `ARL-10`  
**Feature Slug**: `008-customer-profile-ledger-debt`  

---

## 1. Specification & Domain Integrity

- [x] **User Story Format**: Structured in canonical Mike Cohn format ("As an...", "I want to...", "so that...").
- [x] **Jira Traceability**: Maps directly to `ARL-10` and parent epic `ARL-6` (EPIC-2: Core Domain Entities & Primary CRUD Operations).
- [x] **SSOT Alignment**: Reflects `mockup/app.js` (`customerProfile(id)` lines 509-520) and `docs/arl-features.md`.
- [x] **Domain Rules**:
  - [x] Contact details formatted as `[phone] · [address]`.
  - [x] Total debt calculated as sum of unpaid sales balances.
  - [x] Unpaid sales itemized with receipt number, days outstanding, remaining balance, and overdue pill.
  - [x] Fully settled account displays `₱0.00` with *"Fully paid. Nothing is owed."*
  - [x] "New sale" action pre-selects customer in checkout wizard via `customerId` query parameter.

---

## 2. Acceptance Criteria Quality ("Unit Tests for English")

- [x] **Scenario 1: Customer profile overview with debt**
  - [x] Verified for customer "Mang Tonyo Carinderia" (`k2`) with ₱240.00 outstanding.
  - [x] Header contact displays "0928 554 1290 · Public Market Stall 14".
  - [x] Outstanding debt card displays "₱240.00" in red (`text-danger`).
  - [x] Unpaid sale is listed with days outstanding and "Overdue" status pill.
- [x] **Scenario 2: Transaction history table**
  - [x] Customer with 5 past transactions displays all 5 receipts.
  - [x] Columns display receipt number, date, total, remaining balance, payment pill, and order pill.
  - [x] Clicking receipt/row navigates to `/sales/[id]`.
- [x] **Scenario 3: Pre-selected new sale trigger**
  - [x] Clicking "New sale" in profile header navigates to `/sales/new?customerId=[id]`.
  - [x] New Sale customer selector has this customer pre-selected.
- [x] **Scenario 4: Fully settled customer account**
  - [x] Zero debt accounts display "₱0.00" balance.
  - [x] Displays explanatory note "Fully paid. Nothing is owed."

---

## 3. UI/UX & Design Tokens Standards (Zero Hardcoded Colors)

- [x] **No Arbitrary Hex or Default Tailwind Colors**: No inline hex or arbitrary color classes.
- [x] **Semantic Variables**:
  - [x] `bg-bg-surface`, `bg-bg-muted`, `border-border`, `text-text-primary`, `text-text-muted`.
  - [x] `text-danger`, `bg-danger-light`, `border-danger-border` for overdue debt.
  - [x] `text-success`, `bg-success-light` for fully paid transactions.
  - [x] `text-accent`, `bg-accent-light` for pending/partially paid status.
- [x] **Accessibility**:
  - [x] Semantic heading hierarchy (`h1`, `h2`).
  - [x] Accessible breadcrumb navigation with `aria-label="Breadcrumb"`.
  - [x] Contrast ratio $\ge 4.5:1$ on text tokens across light and dark modes.

---

## 4. Test & Verification Readiness

- [x] **Unit & Contract Tests**: Test suite in `tests/customer-profile.test.ts` covering all 4 Gherkin scenarios.
- [x] **Quickstart Walkthrough**: Step-by-step verification commands provided in `quickstart.md`.
