# Research & Technical Constraints: System Settings & Admin Security

**Feature Key**: `ARL-21`  
**Feature Slug**: `008-system-settings-admin-security`  

---

## 1. Architectural Context & Technology Stack

- **Framework**: Next.js 16 (App Router, Server Actions, React 19 Client Components).
- **Styling**: Tailwind CSS v4, zero hardcoded colors (`AGENTS.md` and `.agents/rules/tailwind-v4.md`).
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth (`@supabase/ssr`).
- **Single Sources of Truth (SSOT)**:
  - UI structure and visual tokens from `mockup/index.html`, `mockup/styles.css`, and `mockup/app.js` (lines 596-645).
  - Domain specs from `docs/` and existing database migrations (`public.product_variants`, `public.system_settings`).

---

## 2. Storage Strategy for System Settings

1. **Table Design (`public.system_settings`)**:
   - A single-row configuration or key-value table.
   - For store settings in ARLQ, a typed single-row table or singleton key is clean and atomic:
     ```sql
     CREATE TABLE IF NOT EXISTS public.system_settings (
         id TEXT PRIMARY KEY DEFAULT 'singleton_store_settings',
         reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (reminder_days >= 1),
         admin_mobile TEXT NOT NULL DEFAULT '0917 555 0142',
         notification_channel TEXT NOT NULL DEFAULT 'SMS',
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         CONSTRAINT single_row CHECK (id = 'singleton_store_settings')
     );
     ```
   - RLS: Authenticated admin users have full select and update access.
   - Pre-seeded with baseline: `reminder_days = 7`, `admin_mobile = '0917 555 0142'`, `notification_channel = 'SMS'`.

2. **Batch Stock Minimum Update**:
   - Updates `public.product_variants.min_stock_level`.
   - In Supabase, we can batch update using an RPC function or parallel `upsert`/`update` queries within a transactional boundary or batch execution.
   - For in-memory baseline store (for unit tests / SSR fallback), update variant records by `variant_id` atomically.

3. **Supabase Auth Admin Password Update**:
   - Supabase client auth API:
     ```typescript
     const { error } = await supabase.auth.updateUser({ password: newPassword });
     ```
   - Validation before network dispatch: `newPassword.length >= 8 && newPassword === confirmPassword`. If mismatched, toast `'New passwords do not match'`.

---

## 3. UI Token Consistency (Zero Hardcoded Colors)

All elements must strictly use design system tokens:
- **Card containers**: `bg-bg-surface border border-border rounded-xl shadow-xs`.
- **Form headers and descriptions**: `text-text-primary font-bold`, `text-text-muted text-sm`.
- **Inputs**: `bg-bg-input border border-border focus:border-border-focus text-text-primary px-3 py-2 rounded-md`.
- **Form footer bar**: `bg-bg-muted border-t border-border px-5 py-3.5 flex justify-end gap-2.5 rounded-b-xl`.
- **Primary action buttons**: `bg-primary hover:bg-primary-hover text-text-light font-semibold rounded-md px-4 py-2 text-sm`.
- **Tabs**: `border-b border-border text-text-muted hover:text-text-primary aria-[current=page]:border-primary aria-[current=page]:text-primary font-medium`.
- **Sample reminder box**: `bg-bg-muted border border-border rounded-lg p-4 text-sm text-text-secondary leading-relaxed`.
