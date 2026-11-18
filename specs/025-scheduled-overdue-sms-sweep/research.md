# Technical Research & Architecture Decisions: Automated Scheduled Overdue Sweep Orchestrator

**Feature Key**: `ARL-28`  
**Feature Slug**: `025-scheduled-overdue-sms-sweep`  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  

---

## 1. Architectural Strategy & Design Patterns

### 1.1 Protected Route Handler (`app/api/cron/overdue-sms-sweep/route.ts`)
- **Dual Method Support**: Accepts both `GET` and `POST` methods. Vercel Cron automatically performs HTTP `GET` requests according to `vercel.json`. Administrative invocations, health probes, or webhook triggers can use `POST`.
- **Timing-Safe Constant-Time Comparison**:
  - Unauthenticated attackers could attempt timing attacks against secrets.
  - Using `crypto.timingSafeEqual` with byte length validation ensures zero timing leaks.
  - If `CRON_SECRET` is unset in the environment or authorization header is missing/invalid, return `401 Unauthorized` with JSON error details and log security warning.

### 1.2 Orchestrator Service (`lib/services/sms-cron-service.ts`)
- **Decoupled Architecture**:
  - Keep route handler lean by delegating the entire sweep execution logic to `executeOverdueSmsSweep(options)`.
  - Integrates with `SaleService`, `getSystemSettings`, `dispatchSmsSafe`, and `recordSmsDispatchLog`.
- **Pacing and Concurrency**:
  - External telecom gateways have strict rate limits (e.g. 10-30 req/sec) and burst penalties.
  - The orchestrator processes overdue sales in sequential order or small chunks (concurrency: 2) with a configurable delay (default 150ms) between dispatches.
- **24-Hour Cooldown Filter**:
  - Evaluates `last_sms_sent_at` on each sale against `now - 24 hours`.
  - Suppressed sales increment `summary.cooldownSuppressed` and log an audit record with status `SKIPPED`.
- **Fault Isolation & Partial Success**:
  - Failure on one sale (e.g. carrier timeout or gateway rejection) is caught, increments `summary.errors`, logs to audit ledger, and does not abort the rest of the batch.
- **Response Metrics**:
  - Standardized JSON summary with `salesEvaluated`, `eligibleOverdue`, `cooldownSuppressed`, `adminSmsDispatched`, `customerSmsDispatched`, `customerSmsSkipped`, `errors`, and `durationMs`.

### 1.3 Vercel Cron Schedule (`vercel.json`)
- **Crontab Expression**: `0 0 * * *` (00:00 UTC / 08:00 AM Manila Time, UTC+8).
- Defined in root `vercel.json` under `crons`:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/overdue-sms-sweep",
        "schedule": "0 0 * * *"
      }
    ]
  }
  ```

---

## 2. Technology Stack & Dependencies

- **Runtime**: Node.js 20+ (Next.js 16+ App Router)
- **Cryptography**: `node:crypto` (`timingSafeEqual`)
- **Database / Backend**: Supabase Client (PostgreSQL)
- **SMS Gateway**: PhilSMS REST API v3 via `dispatchSms` & `dispatchSmsSafe`
- **Testing**: Node Test Runner (`node:test`) + `assert/strict`
