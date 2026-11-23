# Implementation Tasks: TextBee Resilience Circuit Breaker & Audit Ledger

**Feature Key**: `ARL-42`  
**Feature Slug**: `029-textbee-resilience-circuit-breaker-audit`  

---

## Phase 1: Domain Contracts & Adapter Layer

- [x] Task 1.1: Add TextBee dispatch contracts and error code taxonomy in `lib/services/textbee-contracts.ts`
  - Define `TextBeeErrorCode` enum covering `DEVICE_OFFLINE`, `DEVICE_NOT_FOUND`, `GATEWAY_AUTH_ERROR`, `GATEWAY_BAD_REQUEST`, `GATEWAY_RATE_LIMITED`, `GATEWAY_SERVER_ERROR`, `NETWORK_UNREACHABLE`, `TIMEOUT`, and `INVALID_RECIPIENT_MOBILE`.
  - Define `TextBeeSendOptions` and `TextBeeSendResult` types and Zod schemas.

- [x] Task 1.2: Implement `sendSmsViaTextBee` in `lib/services/textbee-adapter.ts`
  - Implement HTTP REST client for `POST /gateway/devices/{deviceId}/sendSMS`.
  - Add offline mock mode with UUID generation when `TEXTBEE_MOCK_DISPATCH="true"` or `TEXTBEE_API_KEY` is not set.
  - Implement error response parser normalizing device offline and HTTP error codes into `TextBeeErrorCode`.
  - Provide test injection helpers (`_setMockTextBeeSendHandler`, `_resetTextBeeSendMock`).

---

## Phase 2: Resilience Engine & Circuit Breaker Updates

- [x] Task 2.1: Extend error classification in `lib/services/sms-resilience.ts`
  - Update `isRetryableError()` to treat `DEVICE_OFFLINE`, `GATEWAY_RATE_LIMITED`, `GATEWAY_SERVER_ERROR`, `NETWORK_UNREACHABLE`, and `TIMEOUT` as retryable errors.
  - Ensure permanent errors (`DEVICE_NOT_FOUND`, `GATEWAY_AUTH_ERROR`, `GATEWAY_BAD_REQUEST`, `INVALID_RECIPIENT_MOBILE`) are non-retryable and do not increment breaker failures.

- [x] Task 2.2: Update `dispatchSmsSafe()` to support TextBee gateway
  - Accept `gateway?: 'PHILSMS' | 'TEXTBEE'` in dispatch options (defaulting to PhilSMS or active gateway).
  - Dispatch through `sendSmsViaTextBee` when `gateway === 'TEXTBEE'`.
  - Enforce 5,000ms AbortController deadline across TextBee calls.
  - Map TextBee results and errors to `SafeSmsDispatchResult`.

---

## Phase 3: Audit Ledger & SMS Service Integration

- [x] Task 3.1: Verify audit contracts and latency recording in `lib/services/sms-audit-contracts.ts` and `lib/services/sms-audit-service.ts`
  - Accommodate `gatewayName = 'TEXTBEE'` in database row generation.
  - Ensure execution latency in milliseconds is recorded in `latency_ms` / `latencyMs`.

- [x] Task 3.2: Update `dispatchSms()` in `lib/services/sms-service.ts`
  - Support configuring active gateway (`TEXTBEE` vs `PHILSMS`) via settings or environment.
  - Pass resolved gateway to `dispatchSmsSafe` and log with `gatewayName: "TEXTBEE"`.

---

## Phase 4: Unit Test Suite & Verification

- [x] Task 4.1: Author comprehensive unit test suite in `tests/unit/textbee-resilience.test.ts`
  - Test Scenario 1: Successful TextBee dispatch with audit log persistence.
  - Test Scenario 2: Device offline consecutive failures tripping circuit breaker to `OPEN` and fast-failing in $< 1\text{ms}$.
  - Test Scenario 3: 5,000ms AbortController timeout protection.
  - Test Scenario 4: Non-retryable error handling (401, 400) without tripping breaker.
  - Test Scenario 5: Circuit breaker cooldown and `HALF_OPEN` probe recovery.

- [x] Task 4.2: Full regression and type check verification
  - Run `npm test` across all 32+ suites.
  - Run `npm run typecheck` to confirm zero TypeScript errors.
