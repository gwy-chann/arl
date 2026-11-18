# Quickstart & Verification Guide: SMS Gateway Resilience & Circuit Breaker (ARL-25)

## 1. Quick Usage Example

```typescript
import { dispatchSmsSafe, CircuitBreaker } from '@/lib/services/sms-resilience';

// 1. Safe SMS Dispatch with automatic Circuit Breaker, Timeout, and Retry
const result = await dispatchSmsSafe({
  recipientMobile: '09171234567',
  recipientType: 'CUSTOMER',
  message: 'ARLQ Alert: Settle balance PHP 1,500.00',
});

if (result.success) {
  console.log('Dispatched successfully. Message ID:', result.messageId);
} else {
  console.warn('SMS dispatch failed or circuit open:', result.errorCode, result.error);
  // Continue checkout or business flow without crashing or rolling back transactions
}
```

## 2. Using Custom Circuit Breaker in Unit Tests

```typescript
import { CircuitBreaker } from '@/lib/services/sms-resilience';

let simulatedTime = 1000;
const breaker = new CircuitBreaker({
  failureThreshold: 3,
  cooldownMs: 60000,
  timeoutMs: 5000,
  nowFn: () => simulatedTime,
});

// Simulate 3 failures
breaker.recordFailure();
breaker.recordFailure();
breaker.recordFailure();
console.log(breaker.getState()); // 'OPEN'

// Advance simulated clock past cooldown
simulatedTime += 60001;
console.log(breaker.getState()); // 'HALF_OPEN'

// Probe trial
breaker.recordSuccess();
console.log(breaker.getState()); // 'CLOSED'
```

## 3. Running Unit & Integration Tests

```bash
# Run all tests including SMS resilience
npm test

# Run the dedicated resilience test suite
node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/sms-resilience.test.ts"
```
