# Requirements Quality Checklist: Customer Utang Tracker & Overdue Reminder Queue

**Feature Key**: `ARL-19`  
**Feature Slug**: `014-customer-utang-tracker-reminder-queue`  

---

## 1. Quality & Completeness Validation ("Unit Tests for English")

- [x] **Clear Persona & Motivation**: ARLQ store administrator needing to prioritize debt collection and monitor aging receivables.
- [x] **Route Alignment**: `/customers/balances` displays the utang center matching mockup route `#/customers/balances`.
- [x] **Automatic Age Ranking**: Table rows are sorted descending by the age of the oldest unpaid sale (`days_outstanding`).
- [x] **3-Column KPI Stats**: Highlights Total owed, Overdue (X+ days), and SMS reminder configuration.
- [x] **Accurate Overdue Flagging**: Customer with oldest unpaid sale $\ge 7$ days receives `"Overdue"` pill (`pill bad` / `bg-danger-light text-danger`) and contributes to Overdue total.
- [x] **Accurate Not Yet Due Flagging**: Customer with oldest unpaid sale $< 7$ days receives `"Not yet due"` pill (`pill warn` / `bg-accent-light text-accent`).
- [x] **Direct Customer Profile Navigation**: "Open profile" secondary button navigates to `/customers/[id]`.
- [x] **Oldest Receipt Invoice Link**: Receipt number links directly to `/sales/[id]`.
- [x] **Empty State Handling**: When zero balances exist, shows "No balances" with subtext "All customer accounts are fully paid."
- [x] **Strict Design Tokens**: Zero hardcoded hex codes or default Tailwind palette classes. Uses semantic tokens defined in `globals.css` and `tokens.ts`.
- [x] **Accessibility (WCAG 2.1 AA)**: Semantic table structure with `th`, `td`, proper ARIA attributes, sufficient color contrast for status pills, and accessible keyboard link targets.
- [x] **Responsive Card Layout**: Employs `.tbl-cards` / mobile cards behavior matching mockup on narrow viewports.
