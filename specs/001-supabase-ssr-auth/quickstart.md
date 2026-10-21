# Quickstart & Verification Guide: Supabase SSR Authentication & Session Protection

**Feature Key**: `ARL-2`  
**Feature Slug**: `001-supabase-ssr-auth`  

This guide provides step-by-step instructions for running, testing, and verifying the authentication flow and session protection middleware.

---

## 1. Prerequisites & Environment Configuration

1. **Verify Environment Variables**:
   In the root or worktree directory, ensure `.env.local` contains valid Supabase project credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   > [!NOTE]
   > If `.env.local` is not configured, the system gracefully handles the unconfigured state during local development without crashing the server.

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Access the application at [http://localhost:3000](http://localhost:3000).

---

## 2. Verification Scenarios & Walkthroughs

### Scenario 1: Protected Route Interception (Unauthenticated)
1. Open a new private/incognito browser window.
2. Navigate directly to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) or [http://localhost:3000/inventory](http://localhost:3000/inventory).
3. **Expected Outcome**:
   - Next.js 16 `proxy.ts` / `updateSession` intercepts the request.
   - The browser is redirected immediately to `/login?redirectTo=%2Fdashboard` (or `%2Finventory`).
   - No protected data or application shell renders.

---

### Scenario 2: Administrator Login Screen Visual & Theming Review
1. Navigate to [http://localhost:3000/login](http://localhost:3000/login).
2. **Expected Visuals (SSOT: `mockup/`)**:
   - **Desktop Layout**: Left brand sidebar with green background (`bg-primary`), ARL Quality logo, headline "Know what’s on the shelf and who still owes you.", and subtitle. Right canvas with centered `.login-card`.
   - **Form Card**: Clean white card surface with border (`border-border`), heading "Log in", subtext "Administrator access only.", email input, password input, and full-width green "Log in" button.
   - **Theme Toggle**: Located at the top right of the page. Clicking toggles between light mode and dark mode smoothly using CSS variables without arbitrary hex styles.
   - **Mobile Responsiveness**: Resize viewport below 768px; the layout stacks cleanly into a compact single-column presentation.

---

### Scenario 3: Invalid Credential Rejection
1. On `/login`, enter an invalid email or wrong password (e.g., `invalid@arlq.com` and `wrongpassword`).
2. Click "Log in".
3. **Expected Outcome**:
   - An alert banner appears displaying "Invalid login credentials" styled with semantic danger tokens (`bg-danger-light text-danger border-danger-border`).
   - The entered email remains populated in the input field.
   - The password field is cleared.
   - No session cookies are created; browser remains on `/login`.

---

### Scenario 4: Successful Administrator Login & Return Traversal
1. On `/login?redirectTo=%2Finventory`, enter valid administrator credentials.
2. Click "Log in".
3. **Expected Outcome**:
   - Form state displays loading indicator or pending state.
   - Supabase Auth creates session tokens.
   - Secure HTTP-only cookies are written to the browser response.
   - Browser is redirected to the preserved target route (`/inventory`) or `/dashboard`.
   - Navigating back to `/login` automatically redirects back to `/dashboard`.

---

### Scenario 5: Clean Session Logout
1. From any authenticated page, click the "Log out" button.
2. **Expected Outcome**:
   - Server Action calls `supabase.auth.signOut()`.
   - Session cookies are cleared.
   - Browser is redirected immediately to `/login`.
   - Attempting to visit `/dashboard` or `/inventory` redirects back to `/login`.

---

## 3. Automated Verification Commands

Run the test and typecheck pipeline:
```bash
# Verify TypeScript compile-time safety
npm run typecheck # or npx tsc --noEmit

# Verify ESLint rules
npm run lint

# Verify Next.js build
npm run build
```
