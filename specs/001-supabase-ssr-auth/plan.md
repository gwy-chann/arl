# Technical Implementation Plan: Supabase SSR Authentication & Session Protection

**Feature Key**: `ARL-2`  
**Feature Slug**: `001-supabase-ssr-auth`  
**Jira Story**: STORY-1.1: Supabase SSR Authentication & Session Protection Middleware  

---

## 1. Technical Context & Scope

- **Framework**: Next.js `16.4.2` App Router with React `19.3.0`
- **Database / Auth Provider**: Supabase Auth via `@supabase/ssr` (`^0.12.7`)
- **Routing Interception**: Next.js 16 `proxy.ts` delegating to `lib/supabase/middleware.ts`
- **Styling Architecture**: Tailwind CSS v4, `lib/tokens.ts`, `app/globals.css` (Zero Hardcoded Colors)
- **UI Blueprint**: `mockup/index.html`, `mockup/app.js` (`loginView()`), `mockup/styles.css`

---

## 2. Architectural Boundary & Component Hierarchy

```text
app/
├── (auth)/
│   └── login/
│       ├── page.tsx               # Server Component: reads searchParams (redirectTo), renders layout
│       ├── login-form.tsx         # Client Component: form controls, useActionState, semantic error banner
│       ├── theme-toggle.tsx       # Client Component: accessible dark/light mode toggle button
│       └── actions.ts             # Server Actions: login(formData), logout() via Supabase SSR
├── (protected)/
│   └── dashboard/
│       └── page.tsx               # Server Component: authenticated landing dashboard
lib/
└── supabase/
    ├── client.ts                  # Browser Supabase client helper (createBrowserClient)
    ├── server.ts                  # Server Supabase client helper (createServerClient with cookies())
    └── middleware.ts              # updateSession(): session refresh, route interception & redirection
proxy.ts                           # Next.js 16 proxy router entrypoint
```

---

## 3. Constitution & Guardrails Validation

- [x] **Zero Hardcoded Colors**: All colors use `--bg-*`, `--text-*`, `--primary`, `--border-*`, and `--danger-*` semantic tokens. No arbitrary hex codes (`#1F2933`, `#095B06`, etc.) or default Tailwind colors (`bg-gray-100`).
- [x] **Universal Dark Mode**: Styles leverage CSS variable references (`var(--bg-base)`, `var(--primary)`) so the theme switches automatically when `data-theme="dark"` or `.dark` is applied to `<html>`.
- [x] **SSOT Adherence**: The layout, typography (Figtree sans), branding elements, and copy are ported faithfully from `mockup/`.
- [x] **Next.js 16 Compatibility**: Adheres to Next.js 16 `proxy.ts` convention, eliminating deprecation warnings.

---

## 4. Implementation Phases

### Phase 1: Specifications & Contracts (Done)
- Artifacts: `spec.md`, `research.md`, `data-model.md`, `contracts/auth-contracts.ts`, `checklists/requirements.md`, `quickstart.md`, `plan.md`.

### Phase 2: Core Auth Infrastructure & Route Interception
- Enhance `lib/supabase/middleware.ts` to implement route guarding:
  - If user is not authenticated and attempts to access protected routes (`/dashboard`, `/inventory`, `/sales`, `/`, etc.), redirect to `/login?redirectTo=<encoded-path>`.
  - If user is authenticated and attempts to access `/login`, redirect to `/dashboard`.
  - Maintain session token refresh on all dynamic requests.
- Verify `proxy.ts` passes all matched non-static requests through `updateSession`.

### Phase 3: Server Actions & Authentication Logic
- Create `app/login/actions.ts`:
  - `loginAction(prevState, formData)`: validates input, calls `supabase.auth.signInWithPassword()`, sets cookies, and redirects.
  - `logoutAction()`: calls `supabase.auth.signOut()`, clears session cookies, redirects to `/login`.

### Phase 4: User Interface (`/login`)
- Port `mockup/` split-screen login view into React 19 components using semantic Tailwind classes:
  - Left hero section with ARL Quality logo mark, headline, and subtitle.
  - Right form card with `login-form.tsx` featuring accessible fields, validation error banner, submit button, and forgot password note.
  - Top-right `theme-toggle.tsx` button.

### Phase 5: Authenticated Landing Shell & Verification
- Create basic protected `app/dashboard/page.tsx` with user greeting and "Log out" button to verify the complete end-to-end authentication and logout cycle.
- Run typecheck, lint, and build verification.
