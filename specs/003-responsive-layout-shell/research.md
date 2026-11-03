# Technical Research & Architecture Decisions: Responsive Layout Shell, Sidebar Navigation & Mobile Scrim

**Feature Key**: `ARL-3`  
**Feature Slug**: `003-responsive-layout-shell`  

---

## 1. Stack Constraints & Environment Context

- **Framework**: Next.js 16.4.2 (App Router with Turbopack).
- **React**: React 19.3.0.
- **Styling**: Tailwind CSS v4 with semantic tokens (`app/globals.css`, `lib/tokens.ts`).
- **Icons**: Direct inline SVG icon definitions matching `mockup/app.js` (`ICONS` collection).
- **Authentication**: Supabase SSR (`@supabase/ssr`, `lib/supabase/server.ts`, `app/login/actions.ts`).
- **Single Source of Truth**: `mockup/index.html`, `mockup/styles.css`, and `mockup/app.js`.

---

## 2. Architectural Analysis & Key Decisions

### Decision 1: Layout Shell Composition & Route Structure
- **Challenge**:
  - The app has public pages (`/login`) that must NOT show the admin sidebar or topbar.
  - The app has protected admin routes (`/dashboard`, `/settings/appearance`, and upcoming `/sales`, `/inventory`, etc.) that must share the persistent responsive shell without full-page re-renders.
- **Solution**:
  - Implement a reusable layout component `AppShell` in `components/layout/app-shell.tsx`.
  - Group administrative pages or provide a dedicated layout:
    - In Next.js App Router, we can either use a route group `(admin)` or place the layout in `app/(admin)/layout.tsx` / `app/dashboard/layout.tsx`.
    - However, since `/dashboard` and `/settings` are already top-level directories in `app/`, wrapping them via a cohesive layout or route group is essential.
    - If we place an `app/(admin)` route group, moving `/dashboard` into `app/(admin)/dashboard` and `/settings` into `app/(admin)/settings` preserves exact URLs (`/dashboard` and `/settings/appearance`), while providing a single top-level `layout.tsx` for all admin modules!
    - Alternatively, we can provide `AppShell` and wrap pages or create `app/(admin)/layout.tsx` cleanly.
    - Let's verify whether moving `app/dashboard` and `app/settings` into `app/(admin)` preserves all routes: In Next.js App Router, route groups `(name)` omit the group name from the URL path, so `app/(admin)/dashboard/page.tsx` serves `/dashboard`, and `app/(admin)/settings/appearance/page.tsx` serves `/settings/appearance`. This is the canonical Next.js App Router pattern for authenticated app shells!

### Decision 2: Mobile Drawer State Management (Context vs Local State)
- **Challenge**:
  - The hamburger toggle lives in the `<header className="topbar">`.
  - The sidebar drawer and scrim overlay live in `<aside className="sidebar">` and `<div className="scrim">`.
  - Route navigation should auto-close the drawer on mobile.
  - Pressing `Escape` or clicking the scrim should close the drawer.
  - Window resizing across the 768px (`md`) breakpoint should automatically reset drawer state without leaving an orphan scrim.
- **Solution**:
  - Create `LayoutContext` and `LayoutProvider` (or hook `useLayoutState`) in `components/layout/layout-context.tsx`.
  - Tracks `isSidebarOpen: boolean`, `toggleSidebar()`, `closeSidebar()`, `openSidebar()`.
  - Listens to pathname changes (`usePathname()`) to automatically close mobile drawer on route navigation.
  - Adds an event listener for `Escape` key when `isSidebarOpen` is true.

### Decision 3: Subnavigation Accordion Behavior
- **Challenge**:
  - The mockup allows clicking sections ("Sales", "Inventory", "Products", "Customers") to expand/collapse submenus.
  - Direct navigation to `/sales/new` or `/inventory/in` must ensure the parent module accordion is automatically expanded.
- **Solution**:
  - Track open accordion sections using a record or set of strings (`expandedSections`).
  - Initialize with the active section derived from `usePathname()`.
  - Clicking a section toggle or link expands the nested items smoothly without jumping or losing scroll position.

### Decision 4: Design Token & Visual Consistency (Dark/Light Parity)
- **Challenge**:
  - In `mockup/styles.css`, the sidebar header has special styling in light vs dark:
    - Light: `background: var(--brand)` (`#095B06`), text `#FFFFFF`.
    - Dark: `background: linear-gradient(180deg, #166534 0%, #14532D 100%)`, border-bottom `1px solid #15803D`.
  - Topbar on mobile has `background: var(--brand)` in light, and gradient in dark.
  - Desktop topbar has `background: var(--surface)` with `ThemeToggle`.
- **Solution**:
  - Use semantic classes with dark mode variants:
    - Light: `bg-primary text-text-light`
    - Dark: `dark:bg-linear-to-b dark:from-hero-gradient-from dark:to-hero-gradient-to dark:border-b dark:border-border`
  - Active nav link:
    - Light: `bg-primary-light text-primary font-semibold`
    - Dark: `dark:bg-[rgba(34,197,94,0.22)] dark:text-primary-hover dark:font-bold`
  - Zero hardcoded colors in JSX; all mapped through semantic classes.

---

## 3. Risk Assessment & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| Mobile drawer traps focus or prevents background scroll | When drawer is open, add `overflow-hidden` to body; remove on close. |
| Hydration mismatch from client-side viewport checks | Use CSS media queries (`hidden md:block`, `md:hidden`) for rendering layout differences rather than SSR window.innerWidth checks. |
| Logout form button triggering page refresh | Use existing Server Action `logoutAction` with Next.js form handling. |
| Moving routes into `app/(admin)` breaking imports | Verify build and typecheck with `npm run build` and `npm test`. |
