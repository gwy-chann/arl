# Technical Implementation Plan: Multi-Gateway Router (ARL-41)

## 1. Architectural Strategy

This plan delivers STORY-6.2 (`ARL-41`), introducing a decoupled, pluggable SMS gateway router that acts as the single entry point for outbound carrier communication, sitting directly beneath the resilience layer (`sms-resilience.ts`).

---

## 2. File Modification & Creation Matrix

| Action | Path | Description |
|---|---|---|
| **Create** | `lib/services/sms-gateway-router.ts` | Router core: `SmsGatewayProvider`, `resolveSmsGatewayProvider`, and `dispatchGatewaySms`. |
| **Modify** | `lib/services/sms-resilience.ts` | Delegate execution in `dispatchSmsSafe` through `dispatchGatewaySms`. |
| **Modify** | `lib/services/sms-service.ts` | Harmonize provider references and ensure options propagate cleanly. |
| **Create** | `tests/unit/sms-gateway-router.test.ts` | Unit tests covering resolution precedence, dispatch delegation, and fallback behavior. |

---

## 3. Implementation Steps

### Step 1: Implementation of `lib/services/sms-gateway-router.ts`
- Define types:
  - `SmsGatewayProvider = 'textbee' | 'philsms' | 'mock'`
  - `UnifiedSmsDispatchOptions`
  - `UnifiedSmsDispatchResult`
- Implement `resolveSmsGatewayProvider(options?: { provider?: string }): SmsGatewayProvider`:
  - Priority 1: `options?.provider`
  - Priority 2: `process.env.SMS_GATEWAY_PROVIDER` or `process.env.ACTIVE_SMS_GATEWAY`
  - Priority 3: `TEXTBEE_API_KEY` exists and not empty $\to$ `'textbee'`
  - Priority 4: Default to `'philsms'`
- Implement `dispatchGatewaySms(options: UnifiedSmsDispatchOptions): Promise<UnifiedSmsDispatchResult>`:
  - Resolve provider.
  - If `'textbee'`, call `sendSmsViaTextBee({ recipient: options.recipient, message: options.message, signal: options.signal })`. Map `TextBeeSendResult` $\to$ `UnifiedSmsDispatchResult`.
  - If `'philsms'`, call `sendSmsViaPhilSms({ recipient: options.recipient, message: options.message, senderId: options.senderId, signal: options.signal })`. Map `PhilSmsSendResult` $\to$ `UnifiedSmsDispatchResult`.
  - If `'mock'`, return synthetic success response.

### Step 2: Refactor `lib/services/sms-resilience.ts`
- Import `dispatchGatewaySms` and `SmsGatewayProvider` from `./sms-gateway-router.ts`.
- In `dispatchSmsSafe`, replace the hardcoded `if (targetGateway === 'TEXTBEE')` branch inside `executeWithTimeout` with `dispatchGatewaySms({ recipient: payload.recipientMobile, message: payload.message, signal, provider: targetGateway })`.
- Preserve existing circuit breaker metrics, error handling, retries, and fast-fail behavior.

### Step 3: Author Unit Tests in `tests/unit/sms-gateway-router.test.ts`
- Test 1: Provider resolution precedence (call option > env var > auto-detection > fallback).
- Test 2: Case insensitivity (`"TEXTBEE"`, `"TextBee"`, `"PHILSMS"`).
- Test 3: Delegation to `sendSmsViaTextBee` when provider is `'textbee'`.
- Test 4: Delegation to `sendSmsViaPhilSms` when provider is `'philsms'`.
- Test 5: Error mapping and normalization into `UnifiedSmsDispatchResult`.
- Test 6: Timeout `signal` propagation.

### Step 4: Verification & Regression Testing
- Run `vitest run tests/unit/sms-gateway-router.test.ts`.
- Run all existing test suites to verify zero regressions.
- Run `npm run typecheck` and `npm run lint`.
