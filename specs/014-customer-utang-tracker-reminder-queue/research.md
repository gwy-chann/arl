# Technical Research: Customer Utang (Credit Balance) Tracker & Overdue Reminder Queue

**Feature Key**: `ARL-19`  
**Feature Slug**: `014-customer-utang-tracker-reminder-queue`  

---

## 1. Architectural Strategy & Stack Constraints

1. **Framework & Engine**:
   - Next.js 15+ App Router (`app/(admin)/customers/balances/page.tsx`).
   - Server Component entry point fetches customer balances and reminder settings in parallel:
     ```typescript
     const [utangSummary, reminderSettings] = await Promise.all([
       getCustomerUtangSummaryAction(),
       getReminderSettingsAction(),
     ]);
     ```
   - Client Component `components/customers/customer-utang-tracker.tsx` renders interactive search/filtering, responsive table with card mode on mobile (`tbl-cards`), stats panel (`stats`), status pills, and direct navigation links.
   - Node.js test runner (`node --test --experimental-strip-types`) verifies data aggregation, ranking algorithms, aging calculations, and overdue pill states deterministically.

2. **Domain Logic & Invariants (`lib/customers/customer-service.ts`)**:
   - **Debt Calculation**:
     For each customer $c$, identify all sales $S_c$ where $\text{balance} > 0$:
     $$\text{CustomerBalance}(c) = \sum_{s \in S_c, \text{balance}(s) > 0} \text{balance}(s)$$
   - **Oldest Debt Age**:
     $$\text{OldestSale}(c) = \arg\max_{s \in S_c} (\text{days\_outstanding}(s))$$
     $$\text{OldestDays}(c) = \text{days\_outstanding}(\text{OldestSale}(c))$$
   - **Debt Age Ranking**:
     Sort customers descending by $\text{OldestDays}(c)$:
     $$\text{Rank}(c_a) < \text{Rank}(c_b) \iff \text{OldestDays}(c_a) > \text{OldestDays}(c_b)$$
   - **Overdue Evaluation**:
     $$\text{IsOverdue}(c) = \text{OldestDays}(c) \ge \text{reminderDays}$$
   - **Summary KPI Rollups**:
     $$\text{TotalOwed} = \sum_{c \in \text{Debtors}} \text{CustomerBalance}(c)$$
     $$\text{OverdueOwed} = \sum_{c \in \text{Debtors}, \text{IsOverdue}(c)} \text{CustomerBalance}(c)$$

3. **Mockup Single Source of Truth Alignment (`mockup/app.js` lines 530-550)**:
   - Header with breadcrumb: `Customers / Balances`.
   - Title: `Customers with balances (utang)`, Subtitle: `Unpaid and partially paid sales.`.
   - 3-column stats panel:
     - Total owed: PHP sum and count of debtors.
     - Overdue (${days}+ days): PHP sum and count of overdue debtors with `.alert` styling.
     - Reminders: `SMS to ${admin_mobile}` / `after ${reminder_days} days unpaid`.
   - Table structure:
     - Header: `Customer`, `Oldest unpaid sale`, `Days outstanding` (num), `Balance` (num), `Status`, Action TD.
     - Customer cell: Bold name, phone muted below.
     - Oldest unpaid sale cell: Clickable receipt link (`/sales/[id]`), formatted date muted below.
     - Days outstanding cell: Number of days.
     - Balance cell: Bold currency.
     - Status cell: `pill bad` "Overdue" vs `pill warn` "Not yet due".
     - Action cell: `btn sec sm` "Open profile" (`/customers/[id]`).
   - Empty state: `empty('No balances', 'All customer accounts are fully paid.')`.

4. **Strict Design Tokens & Zero Hardcoded Colors Rule**:
   - Primary: `bg-primary`, `hover:bg-primary-hover`, `text-text-light`
   - Secondary Button: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border`
   - Surfaces: `bg-bg-surface border border-border`
   - Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
   - Danger/Bad: `text-danger`, `bg-danger-light`, `border-danger-border` (overdue pill and alert card)
   - Warning/Accent: `text-accent`, `bg-accent-light`, `border-accent-border` (not yet due pill)
   - Zero hardcoded hex codes or default Tailwind utility colors.
