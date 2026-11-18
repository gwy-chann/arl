# Implementation Tasks: SMS Gateway Resilience & Circuit Breaker (ARL-25)

## Phase 1: Specifications & Contracts
- [x] `T-1.1`: Create SpecKit specification directory `specs/022-sms-resilience-circuit-breaker/`
- [x] `T-1.2`: Generate canonical artifacts: `spec.md`, `research.md`, `checklists/requirements.md`, `data-model.md`, `contracts/sms-resilience-contracts.ts`, `plan.md`, `quickstart.md`

## Phase 2: Circuit Breaker State Machine Engine (`sms-resilience.ts`)
- [ ] `T-2.1`: Implement `CircuitBreaker` class in `lib/services/sms-resilience.ts` supporting `CLOSED`, `OPEN`, and `HALF_OPEN` states.
- [ ] `T-2.2`: Implement configurable options: `failureThreshold` (default 3), `cooldownMs` (default 60,000ms), `timeoutMs` (default 5,000ms), `maxRetries` (default 1), `nowFn` (clock injection).
- [ ] `T-2.3`: Implement state transition logic:
  - Increment failure count on consecutive transient failures.
  - Trip from `CLOSED` to `OPEN` when failure count reaches `failureThreshold`.
  - Shift from `OPEN` to `HALF_OPEN` when `cooldownMs` expires.
  - Transition from `HALF_OPEN` to `CLOSED` on successful probe and clear failures.
  - Transition from `HALF_OPEN` to `OPEN` on failed probe and restart cooldown.
- [ ] `T-2.4`: Export default singleton instance `smsCircuitBreaker`.

## Phase 3: Timeout & Retry Policy Logic
- [ ] `T-3.1`: Implement `executeWithTimeout<T>` using `AbortController` bounded by `timeoutMs` (default 5,000ms).
- [ ] `T-3.2`: Implement error classifier distinguishing transient/retryable errors (timeout, 502, 503, 504, network drops) from non-retryable errors (400, 401, 402, 422).
- [ ] `T-3.3`: Implement exponential backoff retry handler with jitter (`1,000ms + random_jitter(0-250ms)`).

## Phase 4: Non-Blocking Safe Dispatch Wrapper & Service Integration
- [ ] `T-4.1`: Implement `dispatchSmsSafe(payload: SmsDispatchPayload, options?: CircuitBreakerConfig): Promise<SafeSmsDispatchResult>`:
  - Fast-fail in < 1ms when circuit is `OPEN`.
  - Execute dispatch via `sendSmsViaPhilSms` with timeout and retry protection.
  - Record success or failure on circuit breaker.
  - Return structured `SafeSmsDispatchResult` envelope without throwing exceptions.
- [ ] `T-4.2`: Update `lib/services/sms-service.ts`:
  - Wire `dispatchSms` to leverage `dispatchSmsSafe` and `sendSmsViaPhilSms`.
  - Maintain compatibility with audit history logging `dispatchedSmsHistory`.
  - Ensure zero unhandled promise rejections in `sendManualCustomerSmsNudge` and `dispatchOverdueBalanceReminders`.

## Phase 5: Comprehensive Unit & Fault Injection Test Suite
- [ ] `T-5.1`: Create `tests/sms-resilience.test.ts` (and `tests/unit/sms-resilience.test.ts`):
  - Test 1: Timeout abort behavior when external API hangs (> 5,000ms).
  - Test 2: Circuit breaker state transitions (`CLOSED` -> `OPEN` -> `HALF_OPEN` -> `CLOSED`).
  - Test 3: Fast-fail performance during `OPEN` state verified at < 5ms.
  - Test 4: Single probe behavior during `HALF_OPEN` (success recovery vs failure re-trip).
  - Test 5: Transient HTTP 502/503 recovery on single retry with backoff.
  - Test 6: Non-retryable HTTP 401 / 402 fails immediately without retry.
  - Test 7: POS checkout transaction commits even when SMS fails or times out.
- [ ] `T-5.2`: Run test suite via `npm test` and verify 100% pass rate.

## Phase 6: Verification, Typecheck, and PR Preparation
- [ ] `T-6.1`: Run `npm run typecheck` and `npm run lint`.
- [ ] `T-6.2`: Ensure atomic commits per `.agents/rules/atomic-commit.md`.
- [ ] `T-6.3`: Push branch and open Pull Request per `create-pr` skill.
