# Feature Specification: Automated Scheduled Overdue Sweep Orchestrator (Cron / Background Worker)

**Feature Key**: `ARL-28`  
**Feature Slug**: `025-scheduled-overdue-sms-sweep`  
**Jira Story**: STORY-5.5: Automated Scheduled Overdue Sweep Orchestrator (Cron / Background Worker)  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  
**Status**: Ready for Planning & Implementation  

---

## Clarifications

### Session 2026-11-18
- Q: How does the cron authorization handle malformed, missing, or mismatched bearer tokens? → A: Constant-time comparison (`crypto.timingSafeEqual`) is enforced between `CRON_SECRET` and the incoming token. If `CRON_SECRET` is unset, the header is missing, or lengths do not match, the handler returns `401 Unauthorized` immediately with an audit log entry.
- Q: How is the 24-hour cooldown evaluated and tracked across sweep runs? → A: The query checks `last_sms_sent_at IS NULL OR last_sms_sent_at < (now() - interval '24 hours')`. Any sale notified within the past 24 hours is skipped, marked as cooldown-suppressed, and logged as `SKIPPED` in the audit ledger without re-dispatching SMS.
- Q: What throttle pacing and concurrency safeguards prevent carrier throttling? → A: Dispatches run sequentially or in small concurrency chunks (concurrency: 2) with a mandatory 150ms delay between dispatches. Errors on individual sales (e.g. timeout or PhilSMS outage) are isolated so the rest of the batch continues safely.
- Q: Does the route support both GET and POST methods? → A: Yes, Vercel Cron natively sends `GET` requests, while administrative manual trigger or webhook systems can issue `POST` requests. Both methods execute the same secured sweep orchestration.

---

## 1. User Story

**As a** store administrator,  
**I want** an automated daily background sweep (via a secured Next.js Route Handler and cron scheduler) executing every morning at 08:00 AM Manila Time (00:00 UTC) that evaluates overdue customer receivables, verifies 24-hour cooldown periods, and triggers live PhilSMS dual alerts (admin operational alert and courteous customer notification),  
**so that** store management and customers receive punctual credit collection notices without requiring staff to manually remember and trigger reminders each morning.

---

## 2. Business Context & Store Operations

1. **Daily Operational Rhythm in Philippine Food Trading**:
   - Condiment retail and wholesale distribution begins early (7:00 AM - 8:00 AM) as delivery trucks load cases of Toyo, Suka, and Patis for market routes.
   - Cashiers and inventory managers are occupied with morning stock verification and physical dispatch, making manual daily reminders unreliable.
   - An automated morning cron sweep ensures receivables past the overdue threshold (default: 7 days) are flagged consistently every single day.

2. **Security & Financial Runaway Protection**:
   - Unprotected cron endpoints can be triggered by web crawlers or malicious actors, causing thousands of duplicate SMS dispatches that drain prepaid credits.
   - The cron route must be guarded with `CRON_SECRET` using timing-safe comparisons, and every sale must enforce a strict **24-hour cooldown** between SMS dispatches.

---

## 3. Technical Architecture & Component Specifications

### 3.1 File Structure & Deliverables
- `app/api/cron/overdue-sms-sweep/route.ts`: Protected Next.js Route Handler accepting GET and POST requests.
- `vercel.json`: Cron schedule definition (`schedule: "0 0 * * *"` -> 00:00 UTC / 08:00 AM PHT).
- `lib/services/sms-cron-service.ts`: Orchestrator querying eligible overdue sales, applying settings, pacing dispatches, and recording batch metrics.
- `tests/integration/cron-overdue-sweep.test.ts`: Integration test verifying authentication, cooldown filtering, batch dispatching, and audit logging.

### 3.2 Security Architecture & Route Protection
- **Header Authentication**: Inspects `request.headers.get('Authorization')` expecting `Bearer <CRON_SECRET>`.
- **Constant-Time Comparison**:
  ```typescript
  import crypto from 'node:crypto';

  export function isAuthorizedCronRequest(authHeader: string | null): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret || !authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7);
    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(secret);
    if (tokenBuffer.length !== secretBuffer.length) return false;
    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  }
  ```
- **Unauthorized Handling**: Requests failing verification are immediately rejected with `401 Unauthorized` and an error payload.

### 3.3 Overdue Evaluation & Cooldown Query Pipeline
The sweep query executes the following database selection:
1. `payment_status IN ('PARTIALLY_PAID', 'NOT_YET_PAID', 'Pending', 'Partial')`
2. `balance > 0`
3. `days_unpaid >= settings.reminder_days` (default: 7 days)
4. **24-Hour Cooldown Filter**:
   `last_sms_sent_at IS NULL OR last_sms_sent_at < (now() - interval '24 hours')`

### 3.4 Paced Dispatch Execution & Dual Notification
- Paced execution with 150ms throttle delay between SMS sends.
- **Admin SMS**: Sent to `settings.admin_mobile` with customer name, receipt number, amount owed, and days overdue.
- **Customer SMS**: Dispatched only if:
  1. `settings.notify_customer_sms === true`
  2. Customer profile contains a valid Philippine mobile number.
- **Timestamp Update**: When dispatches succeed, `sales.last_sms_sent_at` is updated to current ISO timestamp.
- **Audit Persistence**: Every attempt logs to `sms_dispatch_logs` (`ARL-26`).

### 3.5 Cron Response Payload Format
```json
{
  "success": true,
  "timestamp": "2026-11-18T00:00:00.124Z",
  "summary": {
    "salesEvaluated": 45,
    "eligibleOverdue": 4,
    "cooldownSuppressed": 1,
    "adminSmsDispatched": 3,
    "customerSmsDispatched": 2,
    "customerSmsSkipped": 1,
    "errors": 0,
    "durationMs": 1840
  }
}
```

---

## 4. Acceptance Criteria (BDD Gherkin Scenarios)

```gherkin
Feature: Automated Scheduled Overdue Sweep Orchestrator

  Scenario: Authorized morning cron execution dispatches overdue alerts
    Given a configured CRON_SECRET in the environment
    And 3 sales that have been unpaid for 8 days (threshold: 7 days) with no SMS sent in the last 24h
    When the cron scheduler calls "GET /api/cron/overdue-sms-sweep" with "Authorization: Bearer <valid_token>"
    Then the endpoint responds with HTTP 200 OK
    And the response summary shows 3 admin SMS dispatched and customer SMS according to settings
    And the last_sms_sent_at field on each of the 3 sales is updated to the current timestamp

  Scenario: Unauthorized request is rejected immediately
    Given an HTTP request to "/api/cron/overdue-sms-sweep" without a valid bearer token
    When the endpoint receives the request
    Then it returns HTTP 401 Unauthorized
    And no sales are evaluated and no SMS messages are sent

  Scenario: 24-hour cooldown prevents duplicate daily spamming
    Given a delinquent sale where an SMS reminder was already sent 6 hours ago
    When the morning cron sweep executes
    Then this sale is flagged as in cooldown
    And no new SMS is dispatched to the admin or customer
    And the cooldownSuppressed counter is incremented in the sweep summary

  Scenario: Customer SMS toggle disabled in System Settings
    Given an overdue sale eligible for a reminder
    And the admin has set notify_customer_sms to false in System Settings
    When the cron sweep processes this sale
    Then an operational alert is dispatched to the admin mobile number
    And the customer SMS is skipped
    And the audit log records "Customer notification disabled in settings"

  Scenario: Resilience when external PhilSMS gateway fails during batch sweep
    Given 5 eligible overdue sales
    And the PhilSMS gateway fails on the 3rd sale due to a carrier timeout
    When the cron sweep runs
    Then the error is caught and isolated without aborting the sweep
    And the remaining 2 sales continue processing
    And the response summary reports errors: 1 and successfully processes the others
```

---

## 5. Failure Modes & Operational Safeguards

| Failure Condition | Preventive Safeguard | System Reaction | Error Code / Metric |
| :--- | :--- | :--- | :--- |
| **Missing / Wrong Cron Secret** | `crypto.timingSafeEqual` | Returns HTTP 401 immediately; suppresses query | `UNAUTHORIZED` |
| **PhilSMS Gateway Outage** | Circuit Breaker & Safe Dispatch | Isolates failure per sale; continues batch sweep | `GATEWAY_ERROR` (logged) |
| **Duplicate Webhook / Re-delivery** | 24-hour cooldown check (`last_sms_sent_at`) | Fast-skips already reminded sales | `COOLDOWN_ACTIVE` |
| **Admin Mobile Not Set** | Settings validation | Skips admin SMS; logs warning in audit ledger | `ADMIN_PHONE_MISSING` |
| **Large Batch (>100 overdue)** | Chunking & 150ms pacing | Prevents carrier throttling and socket timeouts | Controlled throughput |
