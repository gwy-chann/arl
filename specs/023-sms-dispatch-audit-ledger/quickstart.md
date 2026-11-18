# Quickstart & Verification Guide: SMS Dispatch & Delivery Audit Ledger

**Feature Key**: `ARL-26`  
**Feature Slug**: `023-sms-dispatch-audit-ledger`  

---

## 1. Running Unit Tests

Run the test suite verifying audit log recording, status mapping, and queries:

```bash
node --no-warnings=ExperimentalWarning --test --experimental-strip-types tests/unit/sms-audit-service.test.ts
```

Run all unit tests across the repository:

```bash
npm test
```

---

## 2. Verification Walkthrough Scenarios

### Scenario 1: Record Successful Gateway Dispatch
1. Call `dispatchSms` with valid payload and customer details.
2. Verify `sms_dispatch_logs` contains a record with:
   - `status`: `'SENT'`
   - `gateway_message_id`: `'philsms_uid_...'`
   - `latency_ms`: `> 0`

### Scenario 2: Record Failed Dispatch (Timeout / Rejection)
1. Simulate gateway timeout or rejected mobile number.
2. Verify `sms_dispatch_logs` contains:
   - `status`: `'FAILED'`
   - `gateway_message_id`: `null`
   - `error_reason`: Descriptive error string

### Scenario 3: Record Skipped Dispatch
1. Process sale with missing customer phone number in overdue sweep.
2. Verify `sms_dispatch_logs` contains:
   - `status`: `'SKIPPED'`
   - `error_reason`: `'Customer phone number missing'`

### Scenario 4: Query History by Sale ID & Customer ID
1. Call `getSmsLogsBySaleId(saleId)`.
2. Verify entries returned in descending order of `dispatched_at`.
