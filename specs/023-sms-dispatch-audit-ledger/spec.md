# Feature Specification: SMS Dispatch & Delivery Audit Ledger with Message ID Tracking

**Feature Key**: `ARL-26`  
**Feature Slug**: `023-sms-dispatch-audit-ledger`  
**Jira Story**: STORY-5.3: SMS Dispatch & Delivery Audit Ledger with Message ID Tracking  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  
**Status**: Ready for Planning & Implementation  

---

## Clarifications

### Session 2026-11-18
- Q: What happens to audit records if a linked sale or customer is deleted? → A: Foreign keys use `ON DELETE SET NULL` so the historical legal audit trail is permanently preserved.
- Q: How is immutability enforced against inadvertent application updates or deletions? → A: A PostgreSQL database trigger `trg_prevent_sms_dispatch_logs_mutation` raises an exception on any UPDATE or DELETE, and Supabase RLS policies permit only SELECT and INSERT for authenticated roles.
- Q: Are skipped SMS dispatches (e.g., missing phone number, SMS notifications disabled, or 24-hour cooldown active) recorded in the audit ledger? → A: Yes, they are recorded with status `'SKIPPED'` and the explanatory text in `error_reason`.

---

## 1. User Story

**As a** store administrator and financial auditor,  
**I want** every outbound SMS notification (automated overdue balance sweeps, manual collection nudges, and operational admin alerts) permanently recorded in an immutable `sms_dispatch_logs` Postgres table with its unique PhilSMS gateway message ID, recipient type, canonical phone number, message text, execution latency, and delivery status,  
**so that** store management maintains an immutable, legally defensible audit trail of credit collection notices (*pautang*) to resolve customer payment disputes and enable telecom carrier message tracing with Smart/Globe/DITO networks.

---

## 2. Context & Business Rationale

1. **Trade Credit Collection & Dispute Resolution**:
   - In Philippine condiment commerce (distributing Toyo, Suka, and Patis to carinderias, restaurants, and sari-sari stores), wholesale distribution frequently operates on 7-day or 15-day credit terms (*pautang*).
   - When accounts become delinquent, customers may dispute overdue charges claiming they were never notified or that notice was sent to the wrong handset.
   - Maintaining an immutable ledger of every dispatched SMS—storing the exact timestamp, mobile number, full message text, delivery status (`SENT`, `FAILED`, `SKIPPED`), and PhilSMS carrier `message_id`—provides unambiguous proof of collection notices.

2. **Telecom Carrier Tracing**:
   - If an SMS fails to reach a handset due to cellular tower congestion, DND settings, or temporary disconnection, the PhilSMS support team requires the `gateway_message_id` (gateway UID) to trace carrier handoff with Smart/Globe/DITO networks.

3. **Asynchronous Non-Blocking Logging**:
   - Auditing must never introduce latency or block point-of-sale checkout or cashier workflows.
   - All logging operations must execute asynchronously and fail gracefully (logging internal errors without interrupting the primary transaction).

4. **Immutability Invariant**:
   - Audit logs are evidentiary legal records. Once an SMS dispatch log entry is inserted, it must **never** be updated or deleted by application clients or administrators.

---

## 3. Business Invariants & Domain Rules

1. **Audit Ledger Schema Invariants**:
   - `id`: UUID primary key, generated via `gen_random_uuid()`.
   - `sale_id`: Nullable UUID referencing `public.sales(id) ON DELETE SET NULL`.
   - `customer_id`: Nullable UUID referencing `public.customers(id) ON DELETE SET NULL`.
   - `recipient_mobile`: Non-empty string (VARCHAR(20)) storing the target phone number.
   - `recipient_type`: Restrained by CHECK constraint to `'ADMIN'` or `'CUSTOMER'`.
   - `message_body`: Non-empty TEXT containing the exact rendered message text.
   - `gateway_name`: VARCHAR(20) defaulted to `'PHILSMS'`.
   - `gateway_message_id`: Nullable VARCHAR(100) storing the gateway message UID (e.g. `philsms_uid_88412`).
   - `status`: Restrained by CHECK constraint to `'SENT'`, `'FAILED'`, or `'SKIPPED'`.
   - `error_reason`: Nullable TEXT containing error messages or skip reasons.
   - `latency_ms`: Nullable integer tracking request roundtrip latency in milliseconds.
   - `dispatched_at`: TIMESTAMPTZ defaulted to `timezone('utc'::text, now())`.
   - `created_at`: TIMESTAMPTZ defaulted to `timezone('utc'::text, now())`.

2. **Immutability Enforcement**:
   - The table `public.sms_dispatch_logs` strictly forbids `UPDATE` and `DELETE` operations.
   - Row Level Security (RLS) policies permit only `SELECT` and `INSERT` for authenticated users.
   - A PostgreSQL trigger `trg_prevent_sms_dispatch_logs_mutation` raises an exception if any `UPDATE` or `DELETE` is attempted.

3. **Outcome Mapping Rules**:
   - **`SENT`**: Successfully dispatched to PhilSMS gateway. `gateway_message_id` contains the gateway UID. `latency_ms` records elapsed dispatch time. `error_reason` is NULL.
   - **`FAILED`**: Dispatch attempted but rejected by gateway, timed out, or network failed. `gateway_message_id` is NULL. `latency_ms` records elapsed time before failure. `error_reason` captures descriptive error.
   - **`SKIPPED`**: Dispatch skipped prior to network transmission (e.g., customer missing valid phone number, notifications disabled, or 24h cooldown active). `gateway_message_id` is NULL. `latency_ms` is 0 or NULL. `error_reason` captures skip reason.

4. **Query & Performance Invariants**:
   - Dedicated indexes on `sale_id`, `customer_id`, `(status, dispatched_at DESC)`, and `gateway_message_id`.
   - Queries by `sale_id` or `customer_id` must return records ordered by `dispatched_at DESC`.

---

## 4. Acceptance Criteria (BDD Gherkin Scenarios)

```gherkin
Feature: SMS Dispatch & Delivery Audit Ledger (ARL-26)

  Scenario: Audit entry recorded on successful PhilSMS dispatch
    Given an overdue collection SMS sent to customer "Mang Inasal Corp"
    When PhilSMS responds with HTTP 200 and uid "philsms_uid_88412"
    Then a record is inserted into "sms_dispatch_logs"
    And the record contains status "SENT"
    And gateway_message_id is "philsms_uid_88412"
    And recipient_type is "CUSTOMER"
    And latency_ms contains the elapsed request duration

  Scenario: Audit entry recorded on gateway rejection or network failure
    Given an SMS dispatch that fails because the recipient number is rejected by the telco
    When the PhilSMS adapter catches the HTTP 422 error
    Then a record is inserted into "sms_dispatch_logs"
    And the record contains status "FAILED"
    And error_reason contains the descriptive error message
    And gateway_message_id is null

  Scenario: Audit entry recorded when customer SMS is skipped
    Given a customer with an overdue balance who has no mobile phone on record
    When the overdue reminder sweep processes this sale
    Then an audit record is inserted into "sms_dispatch_logs"
    And status is "SKIPPED"
    And error_reason is "Customer phone number missing"

  Scenario: Querying audit history by sale ID
    Given an existing sale record with ID "sale-uuid-123" that has received 2 collection nudges
    When an admin requests getSmsLogsBySaleId("sale-uuid-123")
    Then 2 audit records are returned sorted by dispatched_at descending
    And each record contains full message text and dispatch status

  Scenario: Querying audit history by customer ID
    Given a customer record with ID "cust-uuid-456" associated with multiple sales
    When an admin requests getSmsLogsByCustomerId("cust-uuid-456")
    Then audit records for that customer are returned sorted by dispatched_at descending

  Scenario: Immutable audit trail enforcement
    Given existing records in "sms_dispatch_logs"
    When any application client attempts an UPDATE or DELETE operation
    Then the operation is rejected by database constraints or RLS restrictions
```

---

## 5. Failure Modes & Audit Logging Matrix

| Dispatch Outcome | `status` Column | `gateway_message_id` | `error_reason` | Traceability Value |
| :--- | :--- | :--- | :--- | :--- |
| **Delivered to Gateway** | `SENT` | Extracted from API `data.uid` | `NULL` | Immediate telco carrier proof |
| **Insufficient Credits** | `FAILED` | `NULL` | `"HTTP 402: Insufficient credit balance"` | Flags accounting to top up |
| **Gateway Timeout (5s)** | `FAILED` | `NULL` | `"Request aborted: 5000ms timeout"` | Isolates carrier network outages |
| **Circuit Breaker Open** | `FAILED` | `NULL` | `"Circuit breaker is OPEN. Outbound SMS suppressed."` | Fast-fail shedding during outage |
| **Missing Phone Number** | `SKIPPED` | `NULL` | `"Customer mobile is empty or invalid"` | Explains why customer received no SMS |
| **Cooldown Active** | `SKIPPED` | `NULL` | `"Dispatched within last 24h cooldown"` | Prevents customer harassment claims |

---

## 6. Definition of Done (DoD)

1. Database migration runs cleanly on Supabase with foreign keys, check constraints, indexes, and immutability trigger created.
2. Every manual and automated SMS trigger produces an accurate log entry in `sms_dispatch_logs`.
3. 100% unit test coverage for `sms-audit-service.ts` and audit contracts.
4. Table queries execute with indexed lookups on `sale_id` and `customer_id`.
5. Non-blocking asynchronous dispatch ensures POS transaction flow is uninterrupted.
