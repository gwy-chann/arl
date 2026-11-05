# Requirements Quality Checklist: Customer Directory & Live Balance Rollup

**Feature Key**: `ARL-9`  
**Feature Slug**: `007-customer-directory-balance-rollup`  

---

## 1. Requirement Completeness & Coverage

- [x] **User Story Defined**: Explicit user story following Mike Cohn template (As an ARLQ store admin, I want... so that...).
- [x] **Scenario 1 - New Customer Registration**: Given admin on `/customers/new`, when submitting Name, Phone, and Address, record is persisted in Supabase and admin redirects to `/customers/[id]` with toast `"Customer saved"`.
- [x] **Scenario 2 - Real-Time Search Filtering**: Typing `"Carinderia"` or other terms into the search box dynamically filters directory rows in real time.
- [x] **Scenario 3 - Debt Balance Highlighting**: Customer with $> 0$ outstanding unpaid sales displays debt formatted in Philippine Peso (e.g. `₱1,340.00`) in destructive red (`var(--bad)` / `text-danger`).
- [x] **Scenario 4 - Fully Paid Balance Display**: Customer with 0 unpaid sales displays muted dash (`-`) indicating zero debt.

---

## 2. Design System & Accessibility (WCAG 2.1 AA)

- [x] **Zero Hardcoded Colors**: No inline hex (`#...`) or standard Tailwind palette (`bg-blue-600`, `text-red-500`) classes used.
- [x] **Semantic Tokens**: Only `bg-primary`, `bg-secondary`, `text-danger`, `text-text-primary`, `text-text-muted`, `border-border`, etc.
- [x] **Keyboard Navigation & Focus**: Search input, table rows, and form buttons have visible focus rings and accessible labels (`aria-label`).
- [x] **Accessible Table Markup**: Table with proper `<thead>`, `<th>`, `<tbody>`, `<tr>`, `<td data-label="...">` for responsive card wrapping on mobile.

---

## 3. Data Integrity & Validation

- [x] **Zod Validation**: Schema validates `name` (1-100 chars, required), `phone` (7-25 chars, required), `address` (optional string).
- [x] **Database Constraints**: `NOT NULL` constraints on `name` and `phone` in PostgreSQL `customers` table.
- [x] **Mathematical Invariance**: Debt balance cannot be negative ($\ge 0$). Paid sales do not contribute to debt balance.
- [x] **Cross-Boundary Compatibility**: Works with Supabase SSR client in server actions and provides fallback memory repository for automated unit testing.
