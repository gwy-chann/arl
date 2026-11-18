# Interface & Validation Contracts: PhilSMS Credit Balance Monitor

**Feature Key**: `ARL-27`  
**Feature Slug**: `024-philsms-credit-balance-monitor`  

---

## 1. Type Definitions & Zod Schemas

```typescript
import { z } from 'zod';

export type PhilSmsHealthLevel = 'healthy' | 'warning' | 'critical' | 'mock' | 'error';

export const philsmsBalanceDataSchema = z.object({
  balance: z.union([z.string(), z.number()]),
  currency: z.string().default('PHP'),
  sender_id: z.string().optional(),
});

export const philsmsBalanceResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string().optional(),
  data: philsmsBalanceDataSchema.optional(),
});

export interface PhilSmsAccountStatus {
  success: boolean;
  balance: number;
  currency: string;
  senderId: string;
  isMock: boolean;
  cached: boolean;
  cachedAt?: string;
  expiresAt?: string;
  warningLevel: PhilSmsHealthLevel;
  statusText: string;
  errorMessage?: string;
}

export interface GetPhilSmsBalanceOptions {
  forceRefresh?: boolean;
}
```

---

## 2. Server Action Contracts

```typescript
export interface BalanceActionResult {
  success: boolean;
  data?: PhilSmsAccountStatus;
  error?: string;
}
```
