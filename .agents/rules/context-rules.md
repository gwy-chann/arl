# Workspace Context & Source of Truth

When working on any part of the project (especially the Next.js application inside `arl/`):

1. **Specifications & Site Structure**:
   - `docs/`: Functional specifications, data models, and user stories.
   - `specs/`: Feature specifications and contract definitions inside `arl/specs/`.

2. **UI & Logic Blueprint**:
   - `mockup/index.html`: Complete UI reference and prototype for ARLQ system.
   - `mockup/styles.css`: Design tokens, colors, layout styling, and CSS patterns.
   - `mockup/app.js`: Data models, mock database, state management, and mock logic.

3. **Rule**:
   - Do NOT duplicate `docs/` into `arl/`. Keep `docs/` and `mockup/` as single sources of truth at the workspace root and reference them as context when building Next.js components and APIs.

4. **Mandatory Color Tokens Rule**:
   - All colors used in the application MUST strictly derive from the ARL design tokens (`arl/lib/tokens.ts` and `arl/app/globals.css`).
   - Never hardcode raw hex codes or standard Tailwind gray/blue/emerald colors.
   - Use token classes (`bg-bg-base`, `bg-bg-surface`, `bg-primary`, `text-text-primary`, `text-text-secondary`, `border-border`, `bg-success`, `bg-accent`, etc.) to preserve consistent branding and ensure flawless light-mode default with dark-mode compatibility.
