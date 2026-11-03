# Requirements Quality Checklist: Design Token System & Dynamic Theme Switcher

**Feature Key**: `ARL-4`  
**Feature Slug**: `002-design-token-theme-switcher`  
**Checklist Date**: 2026-11-04  

---

## 1. Specification Completeness Checklist

- [x] **User Story Defined**: Formatted as Role / Feature / Benefit (Mike Cohn format).
- [x] **Three Preference Modes Specified**: `light`, `dark`, and `auto` explicitly documented.
- [x] **Jira Scenarios Addressed**:
  - [x] Scenario 1: One-click topbar theme toggle with affirmative toast ("Dark mode enabled").
  - [x] Scenario 2: System default preference sync without page reload.
  - [x] Scenario 3: Zero flash of unstyled content (FOUC) via inline blocking script.
  - [x] Scenario 4: Strict token compliance audit (zero arbitrary hex values).
- [x] **Cross-Tab Synchronization**: LocalStorage storage event handling specified.
- [x] **UI Blueprint Alignment**: Mockup DOM structure and styling classes verified from `mockup/styles.css` and `mockup/index.html`.

---

## 2. Accessibility & Usability (WCAG 2.1 AA)

- [x] **Contrast Ratios**:
  - Light mode text (`#1F2933` on `#F7F7F4` / `#FFFFFF`): > 10:1 (Exceeds 4.5:1 AA requirement).
  - Dark mode obsidian text (`#FFFFFF` and `#E5E7EB` on `#111827` / `#1F2937`): > 12:1.
- [x] **Interactive Targets**: Toggle buttons provide minimum 44x44px touch/click target area.
- [x] **ARIA Accessibility**:
  - `aria-label` attributes present on icon-only and interactive theme toggle triggers (`"Switch to dark mode"`, `"Switch to light mode"`, `"Toggle theme"`).
  - Radio options in Appearance Settings provide semantic `<input type="radio">` with proper label associations.
- [x] **Reduced Motion**: Transitions respect `prefers-reduced-motion` settings where applicable.

---

## 3. Zero-FOUC & Performance Safeguards

- [x] **Pre-Paint Inline Script**: Synchronous script placed directly in `<head>` executes prior to any body rendering.
- [x] **Defensive Storage Parsing**: `try / catch` wraps `localStorage.getItem` to handle private browsing / sandbox storage restrictions safely.
- [x] **Zero Hydration Mismatch**: `suppressHydrationWarning` applied to root elements to keep Next.js console clean.
- [x] **Minimal Footprint**: Inline script is under 300 bytes, avoiding blocking network requests.

---

## 4. Architecture & Token Governance

- [x] **Zero Arbitrary Colors Rule**: Every UI element must map to a semantic Tailwind utility or CSS custom variable.
- [x] **Token SSOT**: `lib/tokens.ts` and `app/globals.css` act as the programmatic and CSS sources of truth.
- [x] **Component Hierarchy**:
  - `ThemeScript`: Server component injecting inline script in `head`.
  - `ThemeProvider`: Client root context managing state and media query subscriptions.
  - `ThemeToggle`: Reusable compact topbar / header button.
  - `ThemePicker`: Comprehensive 3-option card grid for Settings / Appearance.
  - `ToastContainer` & `useToast`: Floating affirmative notification pill.
