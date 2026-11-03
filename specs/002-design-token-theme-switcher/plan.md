# Implementation Plan: Design Token System & Dynamic Theme Switcher

**Feature Key**: `ARL-4`  
**Feature Slug**: `002-design-token-theme-switcher`  
**Epic**: EPIC-1: Foundation, Authentication Hub & App Shell (`ARL-1`)  

---

## 1. Architectural Strategy & Component Tree

```
app/layout.tsx
├── <head>
│   └── <ThemeScript /> (Server Component injecting synchronous pre-paint inline script)
└── <body>
    └── <ThemeProvider> (Client Context Provider handling storage & matchMedia events)
        └── <ToastProvider> (Lightweight toast provider conforming to mockup/styles.css)
            ├── {children} (Pages: /login, /dashboard, /settings/appearance)
            │   ├── <ThemeToggle /> (Topbar sun/moon toggle button)
            │   └── <ThemePicker /> (3-option visual card picker for Appearance Settings)
            └── <ToastContainer /> (Floating bottom-center affirmative notification pills)
```

---

## 2. Layer-by-Layer Implementation Breakdown (Atomic Commit Architecture)

### Unit 1: Specification & Design (`docs(specs)`)
- Complete 8 SpecKit artifacts in `specs/002-design-token-theme-switcher/`.
- Validate against Jira acceptance criteria and mockup blueprints.

### Unit 2: Tooling & Test Runner (`chore(tooling)`)
- Configure `npm test` script in `package.json` utilizing Node.js built-in test runner with TypeScript type stripping (`node --test --experimental-strip-types`).
- Verify linting rules ignore test fixtures or worktree boundaries.

### Unit 3: Domain Models & Design Tokens (`feat(tokens)`)
- Update `lib/tokens.ts` with `ThemePreference`, `ResolvedTheme`, `THEME_STORAGE_KEY`, and `resolveEffectiveTheme`.
- Enrich semantic brand gradient variables in `app/globals.css` to eliminate arbitrary bracket gradients.

### Unit 4: Domain Logic & Automated Unit Tests (`feat(theme)`)
- Implement `lib/theme/theme-contracts.ts` and `lib/theme/theme-utils.ts`.
- Write unit tests covering:
  - Theme resolution (`resolveEffectiveTheme` across light, dark, auto + system permutations).
  - Validation predicates (`isValidThemePreference`).
  - Storage key constants and transitions.

### Unit 5: UI Components, Zero-FOUC Script & Routes (`feat(ui)`)
- Create `components/theme/theme-script.tsx` with optimized inline blocking script.
- Create `components/theme/theme-provider.tsx` and `components/theme/use-theme.ts`.
- Create `components/ui/toast.tsx` and `components/ui/toast-provider.tsx`.
- Refactor `ThemeToggle` to consume `useTheme` and `useToast`, displaying affirmative toast notifications upon toggle.
- Create `ThemePicker` for appearance configuration.
- Create `/settings/appearance` route (and link from dashboard) showcasing the 3-option visual selector.
- Refactor `app/login/page.tsx` and `app/dashboard/page.tsx` to eliminate any arbitrary hex colors, achieving 100% semantic token compliance.

### Unit 6: Tasks Sync & Verification (`docs(specs)`)
- Mark all tasks in `tasks.md` completed.
- Validate `quickstart.md` walkthrough.
- Execute lint, build, and test verification gates.

---

## 3. Verification Gates

1. `npm test` passes all theme resolution and contract unit tests.
2. `npm run lint` passes with 0 errors.
3. `npm run build` succeeds cleanly with Turbopack.
4. Token scan confirms zero arbitrary hex values in component code.
