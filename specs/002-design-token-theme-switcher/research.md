# Technical Research & Architecture Decisions: Design Token System & Dynamic Theme Switcher

**Feature Key**: `ARL-4`  
**Feature Slug**: `002-design-token-theme-switcher`  

---

## 1. Stack Constraints & Environment Context

- **Framework**: Next.js 16.4.2 (App Router with Turbopack).
- **React**: React 19.3.0.
- **Styling**: Tailwind CSS v4 with `@theme` block and CSS custom variables (`app/globals.css`).
- **Single Source of Truth**: `mockup/styles.css`, `mockup/index.html`, and `mockup/app.js`.
- **Target Browsers**: Modern evergreen browsers (Chrome, Edge, Safari, Firefox, Mobile WebKit).

---

## 2. Architectural Analysis & Key Decisions

### Decision 1: Pre-DOM Paint Blocking Script for Zero FOUC (Anti-Flicker)
- **Challenge**: In Next.js App Router, SSR generates static/server HTML. If the user stored `dark` theme, rendering the light default before React mounts and reads `localStorage` results in a noticeable white flash (FOUC).
- **Solution**: Inject an inline `<script>` tag inside `<head>` in `app/layout.tsx`.
  - The script executes synchronously before the browser parses and paints the `<body>`.
  - It reads `localStorage.getItem('arlq-theme')`.
  - If preference is `'dark'` or (`'auto'` and `matchMedia('(prefers-color-scheme: dark)').matches`), it applies `data-theme="dark"` and class `'dark'` to `document.documentElement`.
  - If preference is `'light'`, it sets `data-theme="light"` and removes `'dark'`.
- **Hydration Consideration**: Next.js and React 19 will report hydration mismatch warnings if attributes on `<html>` change before hydration unless `suppressHydrationWarning` is present on `<html>`. `app/layout.tsx` already has `suppressHydrationWarning` on `<html>`.

### Decision 2: State Synchronization (`useSyncExternalStore` vs `Context`)
- **Challenge**: Theme state needs to stay synchronized across:
  1. React component tree (topbar toggle, settings appearance picker, etc.).
  2. LocalStorage persistence (`arlq-theme`).
  3. System OS color scheme changes (`matchMedia('(prefers-color-scheme: dark)')`).
  4. Cross-tab modifications (`window.addEventListener('storage')`).
- **Solution**: Provide a unified `ThemeProvider` with `useTheme` hook:
  - Supports `theme`: `'light' | 'dark' | 'auto'`
  - Exposes `resolvedTheme`: `'light' | 'dark'`
  - Exposes `setTheme(theme: ThemePreference)`
  - Exposes `toggleTheme()` (cycles between light and dark, or next state)
  - Seamlessly emits custom events and window storage events.

### Decision 3: Tailwind v4 Semantic Token Mapping & Zero Arbitrary Hex Rule
- **Challenge**: In `app/login/page.tsx`, an arbitrary Tailwind bracket color was used: `dark:from-[#166534] dark:to-[#14532D]`.
- **Solution**:
  - Add semantic tokens for brand hero gradient: `--brand-gradient-from` and `--brand-gradient-to` or use semantic color mappings in `app/globals.css` (`--primary`, `--primary-hover`, etc.).
  - Ensure all classes strictly use semantic token utilities (`bg-bg-base`, `bg-bg-surface`, `bg-primary`, `text-text-primary`, `border-border`, etc.).
  - Eliminate all arbitrary bracket hex values from component JSX.

### Decision 4: Reusable Toast Notification Architecture
- **Challenge**: Jira Acceptance Criteria Scenario 1 specifies: *"And an affirmative toast displays 'Dark mode enabled'"*.
- **Solution**:
  - Provide a lightweight `ToastProvider` and `useToast()` hook modeled after `mockup/styles.css` (`.toasts` and `.toast`).
  - Supports duration auto-dismiss (default 2800ms matching `mockup/app.js`), checkmark icon, and tokenized styling.
  - Placed globally in `app/layout.tsx` or as part of the core UI shell.
  - Automatically dispatches toasts on theme change:
    - `"Dark mode enabled"`
    - `"Light mode enabled"`
    - `"Theme set to System default"`

---

## 3. Risk Assessment & Mitigations

| Risk | Mitigation |
| :--- | :--- |
| Next.js SSR hydration mismatch on `<html>` | Add `suppressHydrationWarning` to `<html>` and `<body>` in `app/layout.tsx`. |
| LocalStorage access crashing during SSR | Guard all window/localStorage accesses behind `typeof window !== 'undefined'` or inside `useEffect`/`useSyncExternalStore`. |
| Memory leaks from media query listeners | Clean up `matchMedia.removeEventListener('change', handler)` properly in provider effect. |
| Inconsistent class vs attribute theming | Apply both `data-theme="dark"` (for CSS variables) and `.dark` class (for Tailwind `dark:` variant) simultaneously. |
