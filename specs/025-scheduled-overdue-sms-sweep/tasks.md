# Implementation Tasks: Automated Scheduled Overdue Sweep Orchestrator

**Feature Key**: `ARL-28`  
**Feature Slug**: `025-scheduled-overdue-sms-sweep`  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  

---

## Phase 1: Cron Configuration & Environment Schema
- [x] **Task 1.1**: Define cron schedule in `vercel.json` (`path: "/api/cron/overdue-sms-sweep"`, `schedule: "0 0 * * *"`)
- [x] **Task 1.2**: Update `.env.example` with `CRON_SECRET` variable documentation

## Phase 2: Timing-Safe Auth & Batch Orchestrator Service
- [x] **Task 2.1**: Implement `isAuthorizedCronRequest` in `lib/services/sms-cron-service.ts` with constant-time comparison
- [x] **Task 2.2**: Implement `executeOverdueSmsSweep` in `lib/services/sms-cron-service.ts` with:
  - Database query / filtering for unpaid sales past reminder days
  - 24-hour cooldown suppression and `SKIPPED` audit logging
  - Throttled dispatch (150ms pacing) with dual alert support (Admin + Customer)
  - `last_sms_sent_at` timestamp updating on success
  - Per-item error isolation ensuring batch continues on PhilSMS gateway errors
  - Execution summary metrics (`salesEvaluated`, `eligibleOverdue`, `cooldownSuppressed`, `adminSmsDispatched`, `customerSmsDispatched`, `customerSmsSkipped`, `errors`, `durationMs`)

## Phase 3: Next.js Route Handler
- [x] **Task 3.1**: Create `app/api/cron/overdue-sms-sweep/route.ts` handling `GET` and `POST` methods
- [x] **Task 3.2**: Guard endpoint with `isAuthorizedCronRequest`, returning HTTP 401 on missing/mismatched token
- [x] **Task 3.3**: Return standardized HTTP 200 JSON summary on success, HTTP 500 on unexpected exception

## Phase 4: Comprehensive Test Suite & Verification
- [x] **Task 4.1**: Create `tests/integration/cron-overdue-sweep.test.ts` covering all BDD scenarios:
  - Constant-time authorization guard and HTTP 401 rejections
  - Eligible overdue sales dispatch and `last_sms_sent_at` timestamp updates
  - 24-hour cooldown suppression
  - System settings customer SMS toggle disabled
  - External gateway timeout/error resilience during batch
- [x] **Task 4.2**: Verify typecheck and test pass with zero regressions
