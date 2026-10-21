# Tailwind CSS v4 Architectural Standards

This project utilizes **Tailwind CSS v4** with the Turbopack engine. All agents and developers must strictly write modern Tailwind v4 syntax and avoid deprecated or anti-pattern conventions.

---

## 1. Native Fraction Aspect Ratios

In Tailwind CSS v4, aspect ratios are first-class fraction utilities. Bracket notation for standard fractions is prohibited.

- **DO**:
  - `aspect-16/9`
  - `aspect-4/3`
  - `aspect-4/5`
  - `aspect-square`
  - `aspect-video`
- **DON'T**:
  - `aspect-[16/9]` (bracket syntax for standard ratios is obsolete)
  - `aspect-[4/5]`
  - `aspect-[1/1]`

---

## 2. Modern Linear Gradients (`bg-linear-to-*`)

Tailwind v4 replaces the legacy `bg-gradient-to-*` direction syntax with modern CSS linear gradient syntax `bg-linear-to-*`.

- **DO**:
  - `bg-linear-to-r` (linear gradient to right)
  - `bg-linear-to-b` (linear gradient to bottom)
  - `bg-linear-to-t` (linear gradient to top)
  - `bg-linear-to-l` (linear gradient to left)
  - `bg-linear-to-tr` (linear gradient to top-right)
  - `bg-linear-to-br` (linear gradient to bottom-right)
- **DON'T**:
  - `bg-gradient-to-r` (deprecated legacy v3 syntax)
  - `bg-gradient-to-b`
  - `bg-gradient-to-tr`

---

## 3. Canonical Utilities Over Arbitrary Bracket Classes

Always use established design tokens and canonical utility classes rather than ad-hoc bracketed values (`[...]`).

- **DO**:
  - Use project semantic tokens: `bg-bg-base`, `text-text-primary`, `bg-primary`, `border-border`, `p-4`, `gap-3`, `rounded-md`, `rounded-lg`.
  - Use canonical spacing and layout utilities: `w-full`, `max-w-3xl`, `h-10`, `leading-relaxed`.
- **DON'T**:
  - `p-[16px]` -> use `p-4`
  - `text-[16px]` -> use `text-base`
  - `rounded-[8px]` -> use `rounded-lg`
  - `bg-[#095B06]` -> use `bg-primary`
  - `text-[#1F2933]` -> use `text-text-primary`

---

## 4. Semantic Theme Tokens First

Every color application must trace back to the `@theme` definitions in [`app/globals.css`](file:///c:/Users/Roselle%20Tabuena/workspace/arl/app/globals.css).

- Always pair background and foreground colors meaningfully (e.g., `bg-primary` with `text-text-light`, `bg-bg-surface` with `text-text-primary`).
- Never introduce one-off color hexes or third-party palettes into utility strings.
