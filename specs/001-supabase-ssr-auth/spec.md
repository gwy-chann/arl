# Feature Specification: Supabase SSR Authentication & Session Protection Middleware

**Feature Key**: `ARL-2`  
**Feature Slug**: `001-supabase-ssr-auth`  
**Jira Story**: STORY-1.1: Supabase SSR Authentication & Session Protection Middleware  
**Status**: In Progress  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** log in securely with my credentials and maintain persistent session cookies across protected routes,  
**so that** unauthorized visitors cannot view or alter condiment sales and inventory data.

---

## 2. Business Invariants & Rules

1. **Administrator Access Only**: ARLQ is an internal store operations and inventory management system. Self-registration/sign-up is disabled; only existing administrator accounts managed in Supabase Auth can authenticate.
2. **Strict Route Protection**: All internal operational routes (`/dashboard`, `/inventory`, `/sales`, `/customers`, `/products`, `/settings`) require a verified Supabase authentication session.
3. **Session Interception with Return Traversal**: Any unauthenticated request to a protected route must be intercepted by Next.js middleware and redirected to `/login?redirectTo=<encoded-url>`. Upon successful login, the administrator must be redirected back to their intended target route (defaulting to `/dashboard`).
4. **Already-Authenticated Redirection**: If an administrator with an active session navigates to `/login`, they must be redirected automatically to `/dashboard`.
5. **Secure Cookie Handling**: Authentication tokens (access token and refresh token) must be transmitted and stored exclusively through secure, HTTP-only cookie exchange handled by `@supabase/ssr`.
6. **Graceful Handling of Offline/Missing Credentials**: During development or when Supabase credentials are missing/unconfigured, the system must fail gracefully without unhandled fatal server crashes (returning structured error states).
7. **Zero Hardcoded Colors**: All UI elements on `/login` and auth feedback banners must strictly conform to semantic tokens defined in `lib/tokens.ts` and `app/globals.css`.

---

## 3. Gherkin Acceptance Criteria

### Scenario 1: Successful Administrator Authentication
```gherkin
Feature: Administrator Login
  Scenario: Successful login with valid credentials
    Given the user is on the "/login" page
    And the user is not currently authenticated
    When the user enters a valid administrator email and password
    And clicks the "Log in" button
    Then the system authenticates the user credentials via Supabase Auth
    And establishes secure HTTP-only session cookies via @supabase/ssr
    And redirects the administrator to "/dashboard" (or the specified "redirectTo" parameter)
```

### Scenario 2: Invalid Credential Rejection
```gherkin
  Scenario: Attempted login with invalid credentials
    Given an unauthenticated visitor on the "/login" page
    When the visitor enters invalid credentials (wrong email or password)
    And clicks the "Log in" button
    Then the system rejects the authentication attempt
    And displays a high-visibility danger banner stating "Invalid login credentials"
    And preserves the entered email in the input field
    And clears the password field
    And no session cookie is created
```

### Scenario 3: Protected Route Interception
```gherkin
Feature: Route Protection & Interception
  Scenario Outline: Intercepting unauthenticated access to internal routes
    Given an unauthenticated visitor
    When the visitor navigates directly to "<protected_route>"
    Then the Next.js middleware intercepts the request
    And redirects the browser to "/login?redirectTo=<encoded_route>"
    And prevents any internal data or layout components from rendering

    Examples:
      | protected_route    | encoded_route      |
      | /dashboard         | %2Fdashboard       |
      | /inventory         | %2Finventory       |
      | /sales             | %2Fsales           |
      | /inventory/in      | %2Finventory%2Fin  |
```

### Scenario 4: Clean Session Logout
```gherkin
Feature: Administrator Session Termination
  Scenario: Clean session logout from sidebar
    Given an authenticated administrator active on any dashboard page
    When the administrator clicks the "Log out" button in the navigation sidebar
    Then the system invokes Supabase Auth signOut
    And invalidates and clears the session cookies
    And immediately redirects the user to "/login"
    And subsequent attempts to navigate backwards or access protected routes are intercepted
```

---

## 4. User Interface Requirements (SSOT: `mockup/`)

The `/login` screen must reproduce the exact responsive layout, branding, and typography from `mockup/`:

1. **Split-Screen Layout**:
   - **Desktop**: 2-column layout (left brand banner: minmax 440px to 46% width; right form canvas: 1fr).
   - **Mobile (< 768px)**: Single column stack, with compact brand header displaying horizontal logo and title.
2. **Left Brand Hero**:
   - Background: `bg-primary` (light mode), dark green gradient `linear-gradient(180deg, #166534 0%, #14532D 100%)` (dark mode).
   - Logo: ARL Quality logo mark centered.
   - Title (`h1`): "Know what’s on the shelf and who still owes you." (text-text-light, bold 700).
   - Subtitle (`p`): "Stock levels, sales and utang for your toyo, suka and patis business, in one place."
   - Footer: "ARLQ Food Condiments Trading".
3. **Right Authentication Form**:
   - Card wrapper: `bg-bg-surface` (`bg-white` light / `#1F2937` dark), `border border-border`, `rounded-xl`, shadow.
   - Heading: `h2` "Log in" (`text-text-primary`), subtext "Administrator access only." (`text-text-muted`).
   - Fields:
     - Email: `<label for="email">Email</label>` with `<input id="email" type="email" autocomplete="username" required />`
     - Password: `<label for="password">Password</label>` with `<input id="password" type="password" autocomplete="current-password" required />`
   - Action Button: `<button type="submit" class="bg-primary hover:bg-primary-hover text-text-light font-semibold py-3 px-5 rounded-lg w-full">Log in</button>`
   - Feedback: Semantic error alert (`bg-danger-light text-danger border border-danger-border rounded-lg p-3 text-sm`) when auth fails.
   - Hint: "Forgot your password? Contact the system developer to reset it." (`text-text-muted text-sm text-center`).
4. **Theme Toggle**:
   - Absolute positioning in top right corner of `/login`.
   - Allows switching between Light and Dark mode using the standard theme tokens.

---

## 5. Non-Functional & Security Requirements

1. **Token Storage**: No JWT tokens stored in `localStorage` or `sessionStorage`. All auth tokens are stored in secure HTTP-only cookies managed by `@supabase/ssr`.
2. **Server-Side Validation**: Authentication status must be verified server-side in Next.js middleware and Server Components using `supabase.auth.getUser()` (never trust `getSession()` alone on the server).
3. **Response Time**: Authentication redirect and session refresh must complete under 500ms on typical broadband connections.
4. **Accessibility (WCAG 2.1 AA)**:
   - Form inputs have associated labels with matching `id`/`for` attributes.
   - Contrast ratio for all text elements exceeds 4.5:1 in both light and dark themes.
   - Keyboard navigable with focus rings (`border-border-focus` or `ring-primary`).
