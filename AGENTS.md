<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Constitution & Architectural Directives: ARLQ System

This document establishes the binding architectural principles, design guidelines, and single sources of truth for developing the ARLQ Inventory and Sales System.

---

## 1. Single Source of Truth (SSOT)

All agents and contributors must strictly consult and adhere to two primary sources of truth before implementing features, components, or logic:

1. **User Interface & Styling (`mockup/`)**:
   - The [`mockup/`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/mockup/) directory contains the definitive, working visual implementation.
   - Inspect [`mockup/styles.css`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/mockup/styles.css) for spacing, surface treatments, font tokens, borders, and interactive states.
   - Inspect [`mockup/index.html`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/mockup/index.html) and [`mockup/app.js`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/mockup/app.js) for DOM structure, component hierarchy, table layouts, modals, and user flows.
   - Any UI developed must directly reflect the typography, metrics, and visual polish of the mockup.

2. **Domain Logic & Business Specifications (`docs/`)**:
   - The `docs/` directory documents the functional domain models: condiment catalog (toyo, suka, patis), product packaging sizes (350ml, 1L, 1gal), minimum stock thresholds, cost/retail price margins, customer profiles, order fulfillment stages, and payments.
   - Never invent arbitrary domain rules, tax rates, or pricing tiers without checking `docs/`.

---

## 2. Zero Hardcoded Colors Rule (Strict Enforcement)

To guarantee consistent theming, brand cohesion, and maintainability across the entire application:

- **MANDATORY SEMANTIC TOKENS**: All UI components, SVG icons, borders, and layouts **MUST** consume semantic utility classes generated from the design system in [`app/globals.css`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/app/globals.css) and programmatic tokens in [`lib/tokens.ts`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/lib/tokens.ts).
- **STRICTLY FORBIDDEN**:
  - **No arbitrary hex codes**: Never use inline hex values or Tailwind arbitrary brackets (e.g., `text-[#1F2933]`, `bg-[#095B06]`, `border-[#E4E4DF]`).
  - **No default Tailwind palette colors**: Do NOT use default Tailwind colors (e.g., `text-gray-900`, `bg-blue-600`, `bg-zinc-50`, `text-slate-700`).
- **Semantic Class Mapping**:
  - **Surfaces**: `bg-bg-base`, `bg-bg-surface`, `bg-bg-card`, `bg-bg-sidebar`, `bg-bg-input`, `bg-bg-hover`, `bg-bg-muted`
  - **Text**: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-light`
  - **Brand / Action**: `bg-primary`, `hover:bg-primary-hover`, `bg-primary-light`, `border-primary-border`, `bg-secondary`, `hover:bg-secondary-hover`
  - **Feedback / Status**:
    - Success: `bg-success`, `bg-success-light`, `text-success`, `border-success-border`
    - Warning/Accent: `bg-accent`, `bg-accent-light`, `text-accent`, `border-accent-border`
    - Danger: `bg-danger`, `bg-danger-light`, `text-danger`, `border-danger-border`
    - Info: `bg-info`, `bg-info-light`, `text-info`, `border-info-border`
  - **Borders**: `border-border`, `border-border-subtle`, `border-border-focus`

---

## 3. Theme Architecture (Light by Default, Universal Dark Mode)

- **Light Mode is the Default**:
  - The default `:root` variables define the crisp, warm-tinted light theme based on the physical storefront and office operations.
- **Seamless Dark Mode via CSS Variables**:
  - Dark mode variables are defined under `.dark`, `[data-theme="dark"]`, and `@media (prefers-color-scheme: dark)`.
  - Because semantic utility classes reference CSS variables directly (`var(--bg-base)`, `var(--primary)`, `var(--text-primary)`), the entire interface automatically switches themes without scattering redundant, brittle manual `dark:...` class prefixes across JSX templates.
  - Reserve manual `dark:` overrides solely for media assets, external SVG embeds, or specialized canvas elements that cannot inherit CSS custom properties.

---

## 4. Specialized Architectural Rules

Review and follow the specific rule documents located in [`.agents/rules/`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/.agents/rules/):

1. [`.agents/rules/tailwind-v4.md`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/.agents/rules/tailwind-v4.md):
   Enforces Tailwind CSS v4 syntax, fraction aspect ratios (`aspect-16/9`), modern gradients (`bg-linear-to-*`), and clean canonical classes.
2. [`.agents/rules/atomic-commit.md`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/.agents/rules/atomic-commit.md):
   Enforces structured, layer-by-layer atomic Git commits (specifications -> tooling -> database -> domain logic -> UI components -> task sync) with diff-accurate descriptions and commit key traceability.
