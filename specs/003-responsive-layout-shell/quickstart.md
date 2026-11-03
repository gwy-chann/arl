# Quickstart & Verification Guide: Responsive Layout Shell (ARL-3)

## 1. Automated Verification

Execute the test suite validating navigation models, routing logic, active state resolution, and layout helpers:

```bash
npm test
```

Execute typechecking and linter:

```bash
npm run typecheck # or npx tsc --noEmit
npm run lint
```

---

## 2. Interactive Manual Verification Scenarios

### Scenario A: Desktop Navigation & Active State
1. Start development server: `npm run dev`.
2. Visit `http://localhost:3000/dashboard`.
3. Verify the sidebar renders on the left:
   - Header shows ARL Quality logo and "Food Condiments Trading / Inventory and Sales".
   - Primary links: Dashboard, Sales, Inventory, Products, Customers, Reports, Settings.
   - Dashboard link has active primary token styling (`bg-primary-light text-primary font-semibold`).
   - Topbar displays theme toggle.
4. Click "Inventory":
   - Accordion expands to reveal: Stock overview, Stock in, Stock out, Low stock alerts, Movement history.
5. Click "Settings":
   - Navigate to `/settings/appearance`.
   - Verify Settings is now highlighted, while the page content renders within the shell.

### Scenario B: User Profile & Logout
1. Look at the bottom of the sidebar (`side-foot`).
2. Verify user info:
   - Avatar circle with initials `AD`.
   - User name: `Administrator`.
   - Role badge: `Owner account`.
3. Verify the "Log out" button:
   - Hover and click "Log out".
   - Confirm it submits `logoutAction` and redirects to `/login`.

### Scenario C: Mobile Viewport & Drawer
1. Open Chrome DevTools (`F12`), toggle Device Toolbar (Ctrl+Shift+M), select a mobile device (e.g. iPhone 14 or 390x844).
2. Visit `http://localhost:3000/dashboard`.
3. Verify:
   - Desktop sidebar is hidden (`-translate-x-full`).
   - Topbar displays hamburger menu button (`aria-label="Open menu"`), mobile ARL logo, and theme toggle.
4. Tap the hamburger menu button:
   - Sidebar slides smoothly in from the left (`translate-x-0`).
   - Scrim overlay appears behind the sidebar darkening the background (`bg-black/40`).
5. Tap anywhere on the scrim:
   - Drawer slides out and scrim disappears.
6. Open drawer again, press `Escape` key:
   - Drawer closes immediately.
7. Open drawer again, tap a navigation link:
   - Navigates to that route and automatically closes the drawer.
