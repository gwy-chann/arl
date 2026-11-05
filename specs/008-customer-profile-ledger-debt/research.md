# Technical Research: Customer Profile View with Purchase Ledger & Debt Breakdown

**Feature Key**: `ARL-10`  
**Feature Slug**: `008-customer-profile-ledger-debt`  

---

## 1. Architectural Strategy & Stack Constraints

1. **Framework & Engine**:
   - Next.js 15+ App Router (`app/(admin)/customers/[id]/page.tsx`).
   - Server Component entry point resolves dynamic route `params` asynchronously (`const { id } = await params;`).
   - Generates dynamic SEO metadata via `generateMetadata`.
   - Client Component `components/customers/customer-profile.tsx` renders interactive elements, formatted tables, links, and overdue pills.
   - Node.js test runner (`node --test --experimental-strip-types`) executes unit and contract tests deterministically.

2. **Domain Logic & Invariants (`lib/customers/customer-service.ts`)**:
   - `getDaysOutstanding(createdAt: string, asOfDate?: Date): number`:
     Calculates whole days elapsed since `createdAt`:
     $$\text{days} = \max\left(0, \left\lfloor \frac{T_{\text{asOf}} - T_{\text{created}}}{86,400,000} \right\rfloor\right)$$
   - `isSaleOverdue(days: number, overdueThresholdDays: number = 7): boolean`:
     Returns `true` when unpaid sale days outstanding meets or exceeds the threshold.
   - `formatCustomerBalance(balance: number)`:
     - When balance $> 0$: returns formatted currency (e.g. `₱240.00`), `isIndebted: true`, `displayClass: 'text-danger font-semibold'`.
     - When balance $\le 0$: returns `'-'` for ledger tables or `₱0.00` for total balance card headers, `isIndebted: false`.

3. **Pre-Selected New Sale Integration**:
   - Customer profile "New sale" action: `<Link href={/sales/new?customerId=${customer.id}} ...>`
   - The New Sale page (`app/(admin)/sales/new/page.tsx` & client form component) reads search params (`customerId`).
   - Fetches customer list from `getCustomerDirectory()` and sets default selected option to `customerId` if present.

4. **Visual Alignment with Mockup (`mockup/app.js` lines 509-520)**:
   - Header with breadcrumbs: `Customers / [Customer Name]`.
   - Title: `[Customer Name]`, subtitle: `[Phone] · [Address]`.
   - Right action buttons: `Edit` (`btn sec`) and `New sale` (`btn` primary).
   - Left 2/3 column: `Transaction history` table with `Receipt`, `Date`, `Total`, `Balance`, `Payment`, `Order`.
   - Right 1/3 column: `Outstanding balance` card with big number, itemized unpaid sale list, days outstanding, and `Overdue` badge when $\ge 7$ days.

5. **Strict Design Tokens (Zero Hardcoded Colors Rule)**:
   - Tokens defined in `app/globals.css` and `lib/tokens.ts`:
     - Overdue and unpaid badge: `bg-danger-light text-danger border border-danger-border`
     - Paid badge: `bg-success-light text-success`
     - Partially paid / pending badge: `bg-accent-light text-accent`
     - Container surfaces: `bg-bg-surface border border-border rounded-[var(--r)]`
     - Secondary buttons: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border`
     - Primary buttons: `bg-primary hover:bg-primary-hover text-text-light`
