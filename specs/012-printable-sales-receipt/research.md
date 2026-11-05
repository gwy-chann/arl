# Research & Architecture Decisions: Printable Official Sales Receipt

**Feature Key**: `ARL-16`  
**Feature Slug**: `012-printable-sales-receipt`  

---

## 1. Technical Stack Constraints & Precedents

1. **Next.js 16 App Router & Server Components**:
   - The route `/receipt/[id]` should be implemented as an authenticated route under `app/(admin)/receipt/[id]/page.tsx` so that it automatically benefits from `(admin)/layout.tsx` authentication guard while sharing the application shell.
   - Page data fetching: Server component fetching sale details via `SaleService.getSaleById(id)` from `@/lib/sales/sale-service`.

2. **Thermal Receipt Typography & Design System**:
   - Mockup implementation (`mockup/styles.css` line 382-393):
     ```css
     .receipt-wrap {
       display: flex;
       justify-content: center;
       padding: 28px 16px;
       background: var(--sunken);
       border: 1px solid var(--line);
       border-radius: 8px;
     }
     .receipt {
       background: var(--surface);
       width: 400px;
       max-width: 100%;
       border: 1px solid var(--line);
       padding: 30px 28px;
       box-shadow: 0 2px 14px rgba(0,0,0,.06);
       font-family: 'Courier Prime', 'Courier New', monospace;
       font-size: 14.5px;
       color: var(--ink);
     }
     ```
   - In Tailwind CSS v4 and `AGENTS.md` zero hardcoded color rules:
     - Wrap: `bg-bg-input border border-border rounded-lg p-6 sm:p-8 flex justify-center`
     - Receipt card: `bg-bg-surface border border-border shadow-md w-full max-w-[400px] p-6 sm:p-7 text-text-primary font-mono`
     - Dividers: `border-t border-dashed border-border-subtle my-3`
     - Stamp: uppercase bold status with semantic tokens (`text-success` for PAID, `text-accent` for PARTIALLY PAID, `text-danger` for NOT YET PAID).

3. **Print Stylesheet Optimization (`@media print`)**:
   - In `app/globals.css`, add print stylesheet definitions matching the mockup:
     ```css
     @media print {
       body {
         background: #ffffff !important;
         color: #000000 !important;
       }
       .sidebar,
       .topbar,
       .page-head,
       nav[aria-label="Breadcrumb"],
       .no-print,
       .toasts,
       button,
       a {
         display: none !important;
       }
       main#page {
         padding: 0 !important;
         margin: 0 !important;
       }
       .receipt-wrap {
         background: transparent !important;
         border: none !important;
         padding: 0 !important;
         margin: 0 !important;
         display: block !important;
       }
       .receipt {
         border: none !important;
         box-shadow: none !important;
         width: 100% !important;
         max-width: 100% !important;
         padding: 0 !important;
         color: #000000 !important;
       }
       .receipt * {
         color: #000000 !important;
       }
       .receipt hr,
       .receipt .rh {
         border-color: #000000 !important;
       }
     }
     ```
   - This ensures POS thermal printers (58mm/80mm ESC/POS) or standard desktop printers output crisp receipts without wasting ink or paper on UI navigation.

4. **Client vs. Server Component Boundaries**:
   - Page route `app/(admin)/receipt/[id]/page.tsx`: Server Component for database fetching and metadata generation.
   - Interactive components:
     - `ReceiptView`: Monospace thermal receipt presenter.
     - `ReceiptPrintButton`: Client component invoking `window.print()` with a printer icon.
