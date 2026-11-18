# Interface & Validation Contracts: Automated Scheduled Overdue Sweep Orchestrator

**Feature Key**: `ARL-28`  
**Feature Slug**: `025-scheduled-overdue-sms-sweep`  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  

---

## 1. Type Definitions & Schemas

```typescript
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

export const cronSweepSummarySchema = z.object({
  salesEvaluated: z.number().int().nonnegative(),
  eligibleOverdue: z.number().int().nonnegative(),
  cooldownSuppressed: z.number().int().nonnegative(),
  adminSmsDispatched: z.number().int().nonnegative(),
  customerSmsDispatched: z.number().int().nonnegative(),
  customerSmsSkipped: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});

export type CronSweepSummary = z.infer<typeof cronSweepSummarySchema>;

export const cronRouteResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  summary: cronSweepSummarySchema.optional(),
  error: z.string().optional(),
});

export type CronRouteResponse = z.infer<typeof cronRouteResponseSchema>;

export interface OverdueSweepOptions {
  asOfDate?: Date;
  throttleMs?: number;
  supabaseClient?: SupabaseClient | null;
}
```

---

## 2. Timing-Safe Authorization Contract

```typescript
/**
 * Validates the Authorization header using constant-time comparison against CRON_SECRET.
 */
export function isAuthorizedCronRequest(
  authHeader: string | null,
  cronSecret: string | undefined = process.env.CRON_SECRET
): boolean;
```

---

## 3. Cron Sweep Service Orchestrator Contract

```typescript
/**
 * Main orchestration entrypoint executing the scheduled overdue SMS sweep.
 */
export function executeOverdueSmsSweep(
  options?: OverdueSweepOptions
): Promise<CronSweepSummary>;
```
