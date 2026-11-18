# Technical Research & Architecture Decisions: PhilSMS Credit Balance Monitor & Health Diagnostic

**Feature Key**: `ARL-27`  
**Feature Slug**: `024-philsms-credit-balance-monitor`  

---

## 1. Architectural Strategy & Design Patterns

### 1.1 In-Memory / Stale-While-Revalidate Caching Layer
- **Decision**: Implement an in-memory caching wrapper in `lib/services/philsms-balance-service.ts` with explicit TTL timestamps and `forceRefresh` option.
- **Rationale**:
  - The Next.js fetch cache (`{ next: { revalidate: 900 } }`) is well-suited for GET requests, but combining it with an explicit in-memory cache object allows fine-grained unit testing in isolation (Node.js test runner) without requiring a running Next.js server instance or mock fetch cache.
  - In critical state (< 10 credits), the TTL drops to 5 minutes (300 seconds) so that when a top-up occurs, it reflects sooner.
  - Calling `refreshPhilSmsBalanceAction({ forceRefresh: true })` bypasses any cached entries, fetches fresh data, and updates the cache.

### 1.2 Service Architecture (`philsms-balance-service.ts`)
- **Key Functions**:
  1. `getPhilSmsBalance(options?: { forceRefresh?: boolean }): Promise<PhilSmsAccountStatus>`
  2. `evaluateCreditThreshold(balance: number): 'healthy' | 'warning' | 'critical'`
  3. `formatEstimatedPesoValue(credits: number): string`
  4. `_resetPhilSmsBalanceCache(): void` (for deterministic unit tests)
  5. `_setMockPhilSmsBalance(balance: PhilSmsAccountStatus | null): void` (for deterministic unit tests)

### 1.3 Server Action Interface (`app/(admin)/settings/reminders/actions.ts`)
- **Decision**: Create `getPhilSmsAccountStatusAction` and `refreshPhilSmsBalanceAction` in `app/(admin)/settings/reminders/actions.ts`.
- **Rationale**: Server actions run on the server side, safeguarding `PHILSMS_API_TOKEN` and preventing client-side credentials leakage.

### 1.4 UI Architecture (`components/settings/philsms-status-card.tsx`)
- **Component Pattern**: Client component with initial state hydrated from server component (`ReminderSettingsPage`), featuring a refresh button wired to `useTransition` and the server action.
- **Styling**: Strict semantic token classes (`bg-bg-card`, `border-border`, `text-text-primary`, `bg-success-light`, `text-success`, `bg-accent-light`, `text-accent`, `bg-danger-light`, `text-danger`). Zero hardcoded hex values.

---

## 2. Technology Stack & Dependencies

- **Runtime**: Node.js 20+ (Next.js 16+ App Router)
- **Validation**: Zod 3.x
- **Icons**: Lucide React (`Coins`, `RefreshCw`, `AlertTriangle`, `CheckCircle2`, `Radio`, `ShieldAlert`)
- **Testing**: Node Test Runner (`node:test`) + `assert/strict`
- **SMS Gateway**: PhilSMS REST API v3 `GET /balance`
