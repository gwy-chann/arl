# Tasks: Pluggable Multi-Gateway Router & Dynamic Provider Switcher (ARL-41)

## Phase 1: Core Router Contracts & Types
- [x] TASK-1.1: Define `SmsGatewayProvider`, `UnifiedSmsDispatchOptions`, and `UnifiedSmsDispatchResult` contracts in `lib/services/sms-gateway-router.ts`.

## Phase 2: Provider Resolution & Router Implementation
- [x] TASK-2.1: Implement `resolveSmsGatewayProvider()` with strict precedence (call option > env var > auto-detection > default fallback).
- [x] TASK-2.2: Implement `dispatchGatewaySms()` routing outbound dispatches to `sendSmsViaTextBee`, `sendSmsViaPhilSms`, or mock fallback.
- [x] TASK-2.3: Standardize response normalization mapping provider responses to `UnifiedSmsDispatchResult`.

## Phase 3: Resilience Layer Integration
- [x] TASK-3.1: Wire `dispatchGatewaySms` into `dispatchSmsSafe` in `lib/services/sms-resilience.ts`, replacing inline gateway branching.
- [x] TASK-3.2: Verify error code translation and retryability classification for unified dispatch responses.

## Phase 4: Unit Testing & Test-Driven Verification
- [x] TASK-4.1: Author comprehensive unit tests in `tests/unit/sms-gateway-router.test.ts` covering resolution precedence, case insensitivity, and adapter delegation.
- [x] TASK-4.2: Verify end-to-end circuit breaker integration and timeout signal propagation in `tests/unit/sms-gateway-router.test.ts`.

## Phase 5: Non-Regression & Quality Convergence
- [x] TASK-5.1: Run full Vitest suite (`tests/textbee-resilience.test.ts`, `tests/unit/sms-gateway-router.test.ts`, etc.) to confirm zero regressions.
- [x] TASK-5.2: Run `npm run typecheck` and `npm run lint` across the workspace.
