# Quickstart & Verification Guide: Read-Only Database Grounding Tools

**Feature Key**: `ARL-32`  
**Feature Slug**: `017-read-only-database-grounding-tools`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Running Unit Tests

Execute the test suite to verify tool contracts, input validations, error handling, and formatting:

```bash
# Inside the worktree (.worktrees/ARL-32)
npm test
```

To run only the grounding tools test file:
```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/assistant-grounding-tools.test.ts"
```

---

## 2. Verification Scenarios & Expected Outcomes

### Scenario 1: Low-Stock Filter (`getInventorySummary`)
```typescript
import { getInventorySummary } from '@/lib/assistant/assistant-tools';

const result = await getInventorySummary({ lowStockOnly: true });
console.log(result.lowStockCount); // > 0
console.log(result.items.every(item => item.isLowStock)); // true
```
- **Expected Outcome**: All returned items have `stockQuantity <= minStockLevel`. Formatted sizes match `'350 ml'`, `'1 L'`, or `'1 gal'`.

### Scenario 2: Search Query Condiment Filter (`getInventorySummary`)
```typescript
const result = await getInventorySummary({ searchQuery: 'Patis' });
console.log(result.items.every(item => item.productName.toLowerCase().includes('patis'))); // true
```
- **Expected Outcome**: Only Patis variants are returned. Non-existent condiments (e.g. "Mang Tomas") return empty arrays (`items: []`).

### Scenario 3: Sales Overview Aggregation (`getSalesOverview`)
```typescript
import { getSalesOverview } from '@/lib/assistant/assistant-tools';

const result = await getSalesOverview({ timeframe: 'today' });
console.log(result.totalGrossRevenue); // Calculated sum of today's sales
console.log(result.formattedGrossRevenue.startsWith('₱')); // true
```
- **Expected Outcome**: Aggregate figures computed according to Manila timezone date boundaries. Payment counts correctly sum up to total sales count.

### Scenario 4: Customer Debt & Overdue Filter (`getCustomerBalances`)
```typescript
import { getCustomerBalances } from '@/lib/assistant/assistant-tools';

const result = await getCustomerBalances({ overdueOnly: true });
console.log(result.customers.every(c => c.isOverdue && c.totalBalance > 0)); // true
```
- **Expected Outcome**: Only customers with unpaid debt past the threshold (7+ days) are returned.

### Scenario 5: Tool Call Dispatcher (`executeToolCall`)
```typescript
import { executeToolCall } from '@/lib/assistant/assistant-tools';

const payload = await executeToolCall('getStoreSettings', {});
console.log(payload.overdueReminderDays); // 7
```
- **Expected Outcome**: Correctly dispatches the requested tool name and validates inputs against Zod schemas.
