# Research & Architecture Decisions: Supabase SSR Authentication & Session Protection

**Feature Key**: `ARL-2`  
**Feature Slug**: `001-supabase-ssr-auth`  

---

## 1. Technical Stack & Environmental Constraints

| Component | Selected Technology | Version | Rationale & Constraints |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js App Router | `16.4.2` | Native Server Components, Server Actions, modern Turbopack pipeline. Requires adherence to Next.js 16 routing conventions. |
| **Authentication Engine** | Supabase Auth (`@supabase/ssr`) | `^0.12.7` | Official SSR client package for Next.js App Router. Standardizes cookie-based JWT refresh across Server Components, Route Handlers, and proxy/middleware. |
| **Runtime & UI** | React | `19.3.0` | React 19 Server Actions (`useActionState`, pending transitions). |
| **Styling & Theming** | Tailwind CSS v4 + Vanilla Tokens | `^4.0.0` | Zero hardcoded hex colors rule; all styling must use semantic tokens declared in `lib/tokens.ts` and `app/globals.css`. |
| **Routing Interceptor** | Next.js 16 `proxy.ts` | Next 16 convention | Next.js 16 deprecates/migrates `middleware.ts` to `proxy.ts`. Route interception and session token updates must execute in `proxy.ts`. |

---

## 2. Key Architecture Decisions

### Decision 1: Next.js 16 `proxy.ts` vs `middleware.ts`
- **Context**: The project was migrated to Next.js 16 where `proxy.ts` is the standardized gateway for edge route filtering, while avoiding deprecated middleware warnings.
- **Decision**: Centralize session update logic in `lib/supabase/middleware.ts` (`updateSession` helper), and invoke it within `proxy.ts`.
- **Alternatives Considered**:
  - Reverting to `middleware.ts`: Causes Next.js 16 compilation/deprecation warnings.
  - Doing auth checks only inside layout components: Fails Scenario 3 (unauthenticated users would initiate server component renders before redirection, causing data leaks or visual flicker).
- **Outcome**: `proxy.ts` intercepts all requests matching non-static paths, refreshes expired sessions via `updateSession()`, and redirects unauthenticated visits to `/login?redirectTo=...`.

### Decision 2: Server Actions for Authentication Flow
- **Context**: Login form submission needs to authenticate with Supabase, set session cookies, and redirect safely.
- **Decision**: Implement `login` and `logout` as Next.js Server Actions in `app/login/actions.ts`.
- **Rationale**:
  - Server Actions run on the server, keeping Supabase service interactions secure.
  - Automatically handles setting HTTP-only cookies on the response header.
  - Enables smooth client feedback using React's form state handling without exposing auth tokens to client JavaScript.
- **Alternatives Considered**:
  - Client-side `supabase.auth.signInWithPassword()`: Exposes auth handling to client bundle, requires client-side cookie synchronization which can cause race conditions during navigation.
  - Traditional API route (`/api/auth/login`): Requires manual `fetch` boilerplate and serialization; Server Actions are idiomatic in App Router.

### Decision 3: SSR Cookie Management Strategy
- **Context**: Supabase sessions use short-lived access tokens (1 hour) and persistent refresh tokens.
- **Decision**: Follow `@supabase/ssr` cookie contract using `getAll` and `setAll`:
  - `lib/supabase/server.ts`: Creates server client for Server Components and Server Actions with `cookies()` from `next/headers`.
  - `lib/supabase/middleware.ts`: Creates server client with request/response cookie access to refresh tokens during traversal.
  - `lib/supabase/client.ts`: Creates browser client with `createBrowserClient` for any necessary client-side state listeners.

### Decision 4: Protected vs. Public Route Segmentation
- **Context**: Distinguish which routes require authentication vs. which must remain open.
- **Decision**:
  - **Public Routes**: `/login`, `/auth/callback`, favicon and static assets.
  - **Protected Routes**: `/dashboard`, `/inventory`, `/sales`, `/customers`, `/products`, `/settings`, and root `/`.
  - If authenticated user accesses `/login`, redirect to `/dashboard`.
  - If unauthenticated user accesses any protected route, redirect to `/login?redirectTo=<target>`.

### Decision 5: UI & Color Architecture
- **Context**: Banned arbitrary hex colors and default Tailwind palette colors (`AGENTS.md`).
- **Decision**:
  - Brand canvas: `bg-primary`, `hover:bg-primary-hover`, `text-text-light`.
  - Form card: `bg-bg-surface`, `border-border`, `text-text-primary`.
  - Inputs: `bg-bg-input`, `border-border-subtle`, `text-text-primary`, focus ring `border-border-focus`.
  - Error banner: `bg-danger-light`, `text-danger`, `border-danger-border`.
  - Theme switching: Accessible toggle in top-right corner of login page toggling `dark` class on root document.
