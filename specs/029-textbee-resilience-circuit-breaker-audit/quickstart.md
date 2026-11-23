# Quickstart & Verification Guide: TextBee Resilience Circuit Breaker & Audit Ledger

**Feature Key**: `ARL-42`  
**Feature Slug**: `029-textbee-resilience-circuit-breaker-audit`  

---

## 1. Running the Verification Test Suite

All tests run using the native Node.js test runner:

```bash
# Run the specific TextBee resilience unit test suite
node --no-warnings=ExperimentalWarning --test --experimental-strip-types tests/unit/textbee-resilience.test.ts

# Run the complete test suite to ensure zero regressions
npm test
```

---

## 2. Test Scenarios Covered in `tests/unit/textbee-resilience.test.ts`

### Scenario 1: Successful Dispatch via TextBee with Audit Logging
- **Action**: Dispatches an SMS payload with TextBee provider configured.
- **Assertion**:
  - `success === true`
  - Valid `messageId` returned (e.g. `textbee_msg_...`)
  - `sms_dispatch_logs` records entry with `gateway_name = "TEXTBEE"`, `status = "SENT"`, and non-negative `latency_ms`.
  - Circuit breaker remains `CLOSED`.

### Scenario 2: Physical Device Disconnect Tripping Circuit Breaker
- **Action**: Simulates 3 consecutive `DEVICE_OFFLINE` errors from TextBee.
- **Assertion**:
  - Circuit transitions from `CLOSED` to `OPEN`.
  - Subsequent 4th dispatch immediately returns `CIRCUIT_OPEN` in $< 1\text{ms}$ without invoking network.
  - Audit logs record each attempt with `status = "FAILED"` and `gateway_name = "TEXTBEE"`.

### Scenario 3: 5,000ms AbortController Timeout Protection
- **Action**: Injects a slow gateway response taking $> 5,000\text{ms}$.
- **Assertion**:
  - Request is aborted with `SmsTimeoutError` / `errorCode = "TIMEOUT"`.
  - Timeout failure increments circuit breaker failure counter.

### Scenario 4: Non-Retryable Error Handling (401 Auth / 400 Bad Request)
- **Action**: Gateway returns HTTP 401 Unauthorized or HTTP 400 Bad Request.
- **Assertion**:
  - Request immediately fails without retrying.
  - Circuit breaker does not increment consecutive failures.
  - Audit record created with `status = "FAILED"`.

### Scenario 5: Circuit Breaker Half-Open Probing and Recovery
- **Action**: Advances clock past 60,000ms cooldown window.
- **Assertion**:
  - State shifts to `HALF_OPEN`.
  - Exactly 1 trial probe is permitted.
  - Successful dispatch restores state to `CLOSED` and resets failure count to 0.

---

## 3. Environment Variables Reference

```bash
# TextBee Configuration
TEXTBEE_API_KEY="your-textbee-api-key"
TEXTBEE_DEVICE_ID="your-android-device-id"
TEXTBEE_API_URL="https://api.textbee.dev/api/v1"
TEXTBEE_MOCK_DISPATCH="false" # Set "true" to force local mock dispatching

# Active SMS Gateway Selection
SMS_GATEWAY_PROVIDER="TEXTBEE" # or "PHILSMS"
```
