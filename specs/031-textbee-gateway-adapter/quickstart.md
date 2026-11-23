# Quickstart & Verification Guide: TextBee REST Gateway Client Adapter

**Feature Key**: `ARL-40`  
**Feature Slug**: `031-textbee-gateway-adapter`  

---

## 1. Prerequisites

Node.js v20+ and project dependencies installed.

## 2. Test Execution

Run the dedicated TextBee adapter unit test suite:

```bash
npx vitest run tests/unit/textbee-adapter.test.ts
```

Run all TextBee and SMS resilience tests to verify zero regressions:

```bash
npx vitest run tests/unit/textbee-adapter.test.ts tests/unit/textbee-health.test.ts tests/textbee-resilience.test.ts
```

Run TypeScript compilation check:

```bash
npm run typecheck
```

## 3. Manual Interactive Verification Scenario

```typescript
import { sendSmsViaTextBee, _getTextBeeMockHistory, _resetTextBeeMockHistory, normalizePhilippineMobileForTextBee } from '@/lib/services/textbee-adapter';

// 1. Test canonical normalization
console.log(normalizePhilippineMobileForTextBee('09171234567')); // "+639171234567"
console.log(normalizePhilippineMobileForTextBee('(0918) 765-4321')); // "+639187654321"

// 2. Test mock dispatch
_resetTextBeeMockHistory();
const res = await sendSmsViaTextBee({
  recipient: '09171234567',
  message: 'Order #1001 is ready for pickup!',
});

console.log(res);
// { success: true, messageId: 'textbee_...', recipient: '+639171234567', gateway: 'TEXTBEE', rawResponse: { ... } }
console.log(_getTextBeeMockHistory());
```
