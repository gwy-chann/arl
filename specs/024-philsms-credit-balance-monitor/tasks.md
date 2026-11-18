# Implementation Tasks: PhilSMS Credit Balance Monitor & Health Diagnostic

**Feature Key**: `ARL-27`  
**Feature Slug**: `024-philsms-credit-balance-monitor`  

---

## Phase 1: Core Domain Service & Caching (TDD)
- [ ] **Task 1.1**: Define contracts & schemas for PhilSMS balance (`lib/services/philsms-contracts.ts` or `lib/services/philsms-balance-service.ts`)
- [ ] **Task 1.2**: Implement `evaluateCreditThreshold`, `formatEstimatedPesoValue`, and in-memory cache logic (`lib/services/philsms-balance-service.ts`)
- [ ] **Task 1.3**: Implement live API fetcher `getPhilSmsBalance` with error mapping and mock fallback
- [ ] **Task 1.4**: Write unit tests covering threshold logic, caching TTL, force refresh, and error handling (`tests/unit/philsms-balance.test.ts`)

## Phase 2: Server Actions
- [ ] **Task 2.1**: Implement server actions `getPhilSmsAccountStatusAction` and `refreshPhilSmsBalanceAction` in `app/(admin)/settings/reminders/actions.ts`

## Phase 3: UI Component & Design System
- [ ] **Task 3.1**: Build `components/settings/philsms-status-card.tsx` with zero hardcoded colors, semantic tokens, status pills, and warning banners
- [ ] **Task 3.2**: Implement interactive refresh button with loading state

## Phase 4: Page Integration & Verification
- [ ] **Task 4.1**: Integrate `<PhilSmsStatusCard />` into `app/(admin)/settings/reminders/page.tsx`
- [ ] **Task 4.2**: Verify type safety, linting, and full test suite passing
