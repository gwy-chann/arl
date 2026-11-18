# Quickstart & Verification Guide: Automated Scheduled Overdue Sweep Orchestrator

**Feature Key**: `ARL-28`  
**Feature Slug**: `025-scheduled-overdue-sms-sweep`  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  

---

## 1. Running Unit & Integration Tests

Execute the automated test suite verifying route authentication, cooldown suppression, throttled dispatching, and audit logging:

```bash
npm test tests/integration/cron-overdue-sweep.test.ts
```

---

## 2. Interactive Verification via cURL / HTTP

1. Ensure the development server is running:
   ```bash
   npm run dev
   ```

2. Test unauthorized rejection:
   ```bash
   curl -i http://localhost:3000/api/cron/overdue-sms-sweep
   # Expected: HTTP/1.1 401 Unauthorized
   ```

3. Test authorized execution with `CRON_SECRET`:
   ```bash
   curl -i -H "Authorization: Bearer <YOUR_CRON_SECRET>" http://localhost:3000/api/cron/overdue-sms-sweep
   # Expected: HTTP/1.1 200 OK
   # Payload contains { "success": true, "summary": { ... } }
   ```
