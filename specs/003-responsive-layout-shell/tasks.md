# Implementation Tasks: Responsive Layout Shell, Sidebar Navigation & Mobile Scrim

**Feature Key**: `ARL-3`  
**Feature Slug**: `003-responsive-layout-shell`  

---

## Phase 1: Domain Models, Navigation Config & TDD Unit Tests

- [x] `T-101`: Create `lib/layout/nav-config.ts` defining `NAV_ITEMS`, `isRouteActive()`, `getInitialExpandedSections()`, and `getInitials()`.
- [x] `T-102`: Create `tests/layout-navigation.test.ts` covering route matching, nested active resolution, accordion state resolution, and user initials helper.
- [x] `T-103`: Run `npm test` to verify unit test assertions pass.

---

## Phase 2: State Management & UI Context

- [x] `T-201`: Create `components/layout/layout-context.tsx` with `LayoutProvider` and `useLayout()`, supporting `isSidebarOpen`, `openSidebar()`, `closeSidebar()`, `toggleSidebar()`, `expandedSections`, `toggleSection()`, Escape key listener, and route change auto-closing.

---

## Phase 3: Core UI Shell Components

- [x] `T-301`: Create `components/layout/icons.tsx` providing SVG icons matching `mockup/app.js` (`home`, `cart`, `box`, `tag`, `users`, `chart`, `gear`, `out`, `menu`, etc.).
- [x] `T-302`: Create `components/layout/sidebar.tsx` with desktop sticky layout, mobile off-canvas drawer, logo header, navigation list with expandable submenus, active route indicators, user profile info, and logout action button.
- [x] `T-303`: Create `components/layout/topbar.tsx` with mobile hamburger button, brand logo mark, and `ThemeToggle`.
- [x] `T-304`: Create `components/layout/scrim.tsx` with animated backdrop and dismiss click handler.
- [x] `T-305`: Create `components/layout/app-shell.tsx` integrating `LayoutProvider`, `Sidebar`, `Topbar`, `Scrim`, and children.

---

## Phase 4: Route Layout Integration

- [x] `T-401`: Setup `app/(admin)/layout.tsx` resolving authenticated user session from Supabase and rendering `AppShell`.
- [x] `T-402`: Move `app/dashboard` into `app/(admin)/dashboard` and remove duplicate header/logout elements.
- [x] `T-403`: Move `app/settings` into `app/(admin)/settings` so settings pages inherit `AppShell`.

---

## Phase 5: Verification & SpecKit Convergence

- [x] `T-501`: Run `npm test` verifying all test suites pass.
- [x] `T-502`: Run `npx tsc --noEmit` and `npm run lint` verifying zero type or lint errors.
- [x] `T-503`: Verify mobile and desktop responsiveness and theme switching across light and dark modes.
