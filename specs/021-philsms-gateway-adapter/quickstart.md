# Quickstart & Verification Guide: PhilSMS Gateway Adapter (ARL-24)

**Feature Key**: `ARL-24`  
**Feature Slug**: `021-philsms-gateway-adapter`  

---

## 1. Automated Test Execution

Run the dedicated PhilSMS unit test suite:
```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/unit/philsms-adapter.test.ts"
```

Run complete repository test suite:
```bash
npm test
```

Verify TypeScript type safety:
```bash
npm run typecheck
```

---

## 2. Environment Configuration

In `.env.local` (or development environment):
```bash
# PhilSMS Gateway Configuration (Server-Only Secrets)
PHILSMS_API_BASE_URL="https://app.philsms.com/api/v3"
PHILSMS_API_TOKEN="your_philsms_bearer_token_here"
PHILSMS_SENDER_ID="PhilSMS"
PHILSMS_MOCK_DISPATCH="true" # Keep "true" in dev/CI to avoid telco credit billing
```

---

## 3. Usage & Verification Scenarios

### Scenario A: Automated GSM-7 Normalization
```typescript
import { normalizeAndSanitizeGsm7, calculateSmsSegments } from '@/lib/services/philsms-adapter';

const rawMessage = "ARLQ Alert: Settle ₱1,250.00 for receipt “00104” — overdue.";
const sanitized = normalizeAndSanitizeGsm7(rawMessage);
console.log(sanitized);
// "ARLQ Alert: Settle PHP 1,250.00 for receipt \"00104\" - overdue."

const calc = calculateSmsSegments(sanitized);
console.log(calc);
// { encoding: 'GSM-7', characterCount: 65, segmentCount: 1, estimatedCredits: 1, hasNonGsmCharacters: false }
```

### Scenario B: Phone Normalization for PhilSMS
```typescript
import { normalizePhilippineMobileForPhilSms } from '@/lib/services/philsms-adapter';

normalizePhilippineMobileForPhilSms("09171234567");    // "639171234567"
normalizePhilippineMobileForPhilSms("+639171234567");  // "639171234567"
normalizePhilippineMobileForPhilSms("0917 123 4567");  // "639171234567"
```

### Scenario C: Offline Mock Dispatch
```typescript
import { sendSmsViaPhilSms, _getPhilSmsMockHistory, _resetPhilSmsMockHistory } from '@/lib/services/philsms-adapter';

_resetPhilSmsMockHistory();

const result = await sendSmsViaPhilSms({
  recipient: "09171234567",
  message: "Test message from ARLQ",
});

console.log(result.success); // true
console.log(result.messageId); // "mock_philsms_..."
console.log(_getPhilSmsMockHistory()); // Contains dispatched record
```
