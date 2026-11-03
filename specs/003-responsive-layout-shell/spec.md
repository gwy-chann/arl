# Feature Specification: Responsive Layout Shell, Sidebar Navigation & Mobile Scrim

**Feature Key**: `ARL-3`  
**Feature Slug**: `003-responsive-layout-shell`  
**Jira Story**: STORY-1.2: Responsive Layout Shell, Sidebar Navigation & Mobile Scrim  
**Epic**: EPIC-1: Foundation, Authentication Hub & App Shell (`ARL-1`)  
**Status**: In Progress  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** navigate via a responsive layout shell with collapsible sidebar, mobile overlay scrim, and brand topbar,  
**so that** I can seamlessly move between Dashboard, Inventory, Sales, Products, Customers, Reports, and Settings on any device.

---

## 2. Business Invariants & Rules

1. **Authenticated Shell Boundary**: The layout shell wraps all authenticated administrative routes (`/dashboard`, `/sales`, `/inventory`, `/products`, `/customers`, `/reports`, `/settings`). If a session is invalid or expired, `middleware.ts` intercepts requests before rendering the shell.
2. **Strict Semantic Token Adherence**: All surfaces, text, active indicator pills, borders, and overlays MUST consume the semantic CSS variables and design tokens (`bg-bg-base`, `bg-bg-surface`, `bg-bg-sidebar`, `border-border`, `text-text-primary`, `text-primary`, `bg-primary-light`, etc.) defined in `lib/tokens.ts` and `app/globals.css`. Zero hardcoded hex codes or arbitrary bracket classes are permitted.
3. **Module Navigation Parity**: The sidebar must provide structured primary navigation matching the Mockup and Scope Statement:
   - **Dashboard**: `/dashboard`
   - **Sales**: `/sales` (Subnav: `New sale` -> `/sales/new`, `Sales list` -> `/sales`)
   - **Inventory**: `/inventory` (Subnav: `Stock overview` -> `/inventory`, `Stock in` -> `/inventory/in`, `Stock out` -> `/inventory/out`, `Low stock alerts` -> `/inventory/low`, `Movement history` -> `/inventory/history`)
   - **Products**: `/products` (Subnav: `Product list` -> `/products`, `Categories` -> `/products/categories`)
   - **Customers**: `/customers` (Subnav: `Customer list` -> `/customers`, `Customers with balances` -> `/customers/balances`)
   - **Reports**: `/reports`
   - **Settings**: `/settings` (or `/settings/appearance`)
4. **Active Route Indication**:
   - The primary navigation item matching the current pathname is highlighted with `bg-primary-light` / `text-primary` (`font-semibold`).
   - If a primary item contains subnavigation, the accordion automatically expands when the user is within that module route tree.
   - The specific nested child route item is highlighted within the subnavigation list (`text-primary font-bold`).
5. **Brand Identity & Store Context**:
   - Sidebar header: Features the official ARL Quality logo mark, with subtitle text: *"Food Condiments Trading"* and *"Inventory and Sales"*. In light mode, styled with primary brand background; in dark mode, styled with dark green obsidian gradient (`--hero-gradient-from` to `--hero-gradient-to`).
   - Sidebar footer: Displays the current administrator's identity (avatar initials `AD`, name `Administrator` or auth email), role badge (`Owner account`), and an accessible Log Out action button triggering `logoutAction`.
6. **Responsive Layout Shell & Mobile Scrim Behavior**:
   - **Desktop (>= 768px / `md` breakpoint)**: Sidebar is fixed/sticky on the left with a width of 260px (`var(--sidebar)`). Topbar sits atop the main content area (height 52px) with the theme toggle in the top-right. Mobile hamburger menu button and scrim overlay are hidden.
   - **Mobile (< 768px)**: Sidebar is off-canvas by default (`-translate-x-full`). Tapping the hamburger button slides the sidebar into view (`translate-x-0`) with a smooth 200ms transition and activates a semi-transparent scrim (`rgba(20, 22, 19, 0.4)` / `bg-black/40`) at `z-50`.
   - **Dismissal Controls**: Tapping the scrim, pressing the `Escape` key, or navigating to any link immediately closes the mobile drawer and restores body scrolling.
7. **Accessibility (WCAG 2.1 AA)**:
   - Semantic landmarks: `<aside>` for sidebar, `<nav aria-label="Main">` for navigation links, `<header>` for topbar, `<main>` for primary page content.
   - Mobile menu toggle button carries `aria-label="Open menu"` and `aria-expanded="true|false"`.
   - All interactive elements meet 44x44px minimum touch target requirements on mobile viewports.

---

## 3. Gherkin Acceptance Criteria

### Scenario 1: Full module navigation list
```gherkin
Feature: Sidebar Primary Navigation
  Scenario: Displaying all store administrative modules
    Given an authenticated admin on any administrative route
    When the sidebar renders
    Then it must display links to: Dashboard, Sales, Inventory, Products, Customers, Reports, and Settings
    And the currently active route must be visually highlighted with the primary brand token color
```

### Scenario 2: User profile and store info display
```gherkin
Feature: Sidebar Brand and User Identity
  Scenario: Displaying store logo, subtitle, and user profile
    Given the admin sidebar header and footer
    When rendered
    Then it displays the ARLQ logo mark
    And it displays the store subtitle "Food Condiments Trading / Inventory and Sales"
    And it displays the current logged-in user name "Administrator"
    And it displays the role badge "Owner account"
    And it displays a functional "Log out" button
```

### Scenario 3: Subnavigation accordion expansion
```gherkin
Feature: Subnavigation Accordion Interaction
  Scenario: Expanding nested navigation items
    Given an admin viewing the sidebar on desktop
    When they click an expandable module ("Sales", "Inventory", "Products", or "Customers")
    Or when navigating directly to a nested route
    Then the corresponding nested subnavigation items expand smoothly without page jump
    And the active nested item is styled with primary accent color
```

### Scenario 4: Mobile drawer and scrim interaction
```gherkin
Feature: Mobile Navigation Drawer & Scrim Overlay
  Scenario: Opening and closing mobile navigation
    Given a user on a mobile viewport (<768px)
    When they tap the hamburger menu button in the topbar
    Then the sidebar slides in over a darkened scrim overlay
    And when the user taps the scrim or presses Escape
    Then the drawer closes immediately and the scrim fades out
```

---

## 4. UI Specification (Source of Truth: `mockup/`)

### 4.1. Desktop Layout Structure
- Grid or flex container: `grid-cols-[260px_1fr]` or fixed sidebar `w-[260px]` with `min-h-screen`.
- Topbar: `height: 52px`, `bg-bg-surface border-b border-border`, flex items center with `ThemeToggle` positioned right.
- Content area: `flex-1 min-w-0 bg-bg-base`, padding `p-6 md:p-10`.

### 4.2. Mobile Layout Structure
- Topbar: `height: auto` (or 52px), `bg-primary text-text-light` (or tokenized), displaying hamburger button, mobile logo mark, and theme toggle.
- Drawer: `fixed inset-y-0 left-0 w-[280px] z-60 bg-bg-surface border-r border-border transition-transform`.
- Scrim: `fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50`.

---

## 5. Assumptions & Scope Boundaries

- **In Scope**:
  - Layout shell component (`AppShell`) wrapping children.
  - Sidebar navigation component (`Sidebar`) with accordions, module links, and user identity.
  - Topbar component (`Topbar`) with hamburger button, brand logo, and theme toggle.
  - Mobile scrim overlay (`Scrim`) and responsive drawer state management.
  - Integration with Next.js App Router for authenticated admin pages.
- **Out of Scope**:
  - Implementation of individual module pages (Inventory CRUD, Sales POS, Customers list) - these will render inside `{children}`.
  - Customer-facing interfaces or customer accounts (ARLQ is strictly admin-only).
