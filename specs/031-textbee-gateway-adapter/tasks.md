# Tasks: TextBee REST Gateway Client Adapter, Canonical Phone Normalizer & Mock Engine

**Feature Key**: `ARL-40`  
**Feature Slug**: `031-textbee-gateway-adapter`  

---

## Phase 1: Setup & Contracts

- [ ] T001 Update contract types and Zod schemas in `lib/services/textbee-contracts.ts` with `recipient`, `gateway: 'TEXTBEE'`, and `TextBeeMockRecord`
- [ ] T002 Document TextBee environment variables in `.env.example`

## Phase 2: Foundational & TDD Test Suite

- [ ] T003 Author comprehensive unit test suite in `tests/unit/textbee-adapter.test.ts` covering normalization, mock dispatch, live fetch mock, error mapping, and secret isolation

## Phase 3: User Story 1 (Implementation)

- [ ] T004 [US1] Implement `normalizePhilippineMobileForTextBee()` in `lib/services/textbee-adapter.ts` enforcing canonical E.164 (`+639XXXXXXXXX`)
- [ ] T005 [US1] Implement in-memory mock history registry (`_getTextBeeMockHistory()`, `_resetTextBeeMockHistory()`) in `lib/services/textbee-adapter.ts`
- [ ] T006 [US1] Update `sendSmsViaTextBee()` in `lib/services/textbee-adapter.ts` with normalization, mock dispatch logging, signal handling, and standardized `TextBeeSendResult`
- [ ] T007 [US1] Align existing consumers (`lib/services/sms-gateway-router.ts`, etc.) if needed with updated contracts

## Phase 4: Polish & Verification

- [ ] T008 Run vitest test suite `tests/unit/textbee-adapter.test.ts` and verify 100% pass rate
- [ ] T009 Run existing regression suites `tests/unit/textbee-health.test.ts` and `tests/textbee-resilience.test.ts`
- [ ] T010 Run `npm run typecheck` and `npm run lint`
