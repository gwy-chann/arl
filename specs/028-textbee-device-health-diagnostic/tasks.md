# Implementation Tasks: TextBee Device Connection Health Diagnostic

**Feature Key**: `ARL-43`  
**Feature Slug**: `028-textbee-device-health-diagnostic`  

---

## Phase 1: Contracts & Domain Schemas (TDD Foundation)
- [x] **Task 1.1**: Define contracts, Zod schemas, and TypeScript interfaces in `lib/services/textbee-contracts.ts`
- [x] **Task 1.2**: Define evaluation helper functions for battery threshold and health levels in `lib/services/textbee-health-service.ts`

## Phase 2: Core Service Layer & Caching (TDD)
- [x] **Task 2.1**: Implement `getTextBeeDeviceHealth()` with live REST fetch, API key authentication, and offline mock fallback
- [x] **Task 2.2**: Implement in-memory TTL caching (15m standard, 5m critical) with forced bypass (`forceRefresh: true`)
- [x] **Task 2.3**: Write comprehensive unit tests in `tests/textbee-health.test.ts` covering healthy, warning (<20%), critical (<10%), offline, charging, caching, and mock modes

## Phase 3: Server Actions
- [x] **Task 3.1**: Implement `getTextBeeDeviceHealthAction()` and `refreshTextBeeDeviceHealthAction()` in `app/(admin)/settings/reminders/actions.ts`
- [x] **Task 3.2**: Implement `getSmsGatewayStatusAction()` supporting polymorphic gateway status retrieval

## Phase 4: UI Status Card & Design System
- [x] **Task 4.1**: Create `components/settings/sms-status-card.tsx` as a flexible, polymorphic gateway status card supporting TextBee and PhilSMS
- [x] **Task 4.2**: Refactor `components/settings/philsms-status-card.tsx` to wrap or delegate cleanly to `sms-status-card.tsx` maintaining 100% backward compatibility
- [x] **Task 4.3**: Implement interactive "Refresh Connection" button with loading transition and toast feedback
- [x] **Task 4.4**: Ensure strict zero-hardcoded-colors rule compliance with semantic Tailwind v4 tokens

## Phase 5: Page Integration & Verification
- [x] **Task 5.1**: Integrate `<SmsGatewayStatusCard />` into `app/(admin)/settings/reminders/page.tsx`
- [x] **Task 5.2**: Run `npm run typecheck`, `npm run lint`, and `npm test` to verify 100% pass rate
