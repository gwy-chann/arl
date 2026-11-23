# Quickstart & Verification Guide: Multi-Gateway Router (ARL-41)

This guide documents the procedures for executing and verifying the Pluggable Multi-Gateway Router implementation.

---

## 1. Running Unit & Integration Tests

Execute the dedicated test suite inside the worktree:

```bash
# Run unit tests for the SMS Gateway Router
npx vitest run tests/unit/sms-gateway-router.test.ts

# Run resilience and regression tests
npx vitest run tests/textbee-resilience.test.ts
npx vitest run tests/unit/sms-resilience.test.ts
```

---

## 2. Dynamic Provider Switching Scenarios

### Scenario A: Force TextBee Gateway
```typescript
import { dispatchGatewaySms } from '@/lib/services/sms-gateway-router';

process.env.SMS_GATEWAY_PROVIDER = 'textbee';

const result = await dispatchGatewaySms({
  recipient: '09171234567',
  message: 'Testing TextBee Router Integration',
});

console.log(result.provider); // 'textbee'
console.log(result.success);  // true
```

### Scenario B: Force PhilSMS Gateway
```typescript
process.env.SMS_GATEWAY_PROVIDER = 'philsms';

const result = await dispatchGatewaySms({
  recipient: '09171234567',
  message: 'Testing PhilSMS Router Integration',
});

console.log(result.provider); // 'philsms'
```

### Scenario C: Explicit In-Call Override
```typescript
// Even if env is set to philsms, call option overrides it
const result = await dispatchGatewaySms({
  recipient: '09171234567',
  message: 'Overriding to TextBee',
  provider: 'textbee',
});

console.log(result.provider); // 'textbee'
```

---

## 3. Full System Verification

Verify TypeScript compilation and lint cleanliness:

```bash
npm run typecheck
npm run lint
```
