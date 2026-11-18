# Quickstart & Verification Guide: PhilSMS Credit Balance Monitor

**Feature Key**: `ARL-27`  
**Feature Slug**: `024-philsms-credit-balance-monitor`  

---

## 1. Running Unit & Integration Tests

Execute the unit test suite covering balance fetching, caching TTL, threshold categorization, and error handling:

```bash
npm test tests/unit/philsms-balance.test.ts
```

---

## 2. Interactive Manual Verification

1. Start development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/settings/reminders`.
3. Verify the **PhilSMS Gateway Status Card**:
   - In default development mode (`PHILSMS_MOCK_DISPATCH="true"` or token omitted):
     - Displays badge: `Mock Gateway Mode (Offline Development)`
     - Credit indicator: `Unlimited (Local Mock)`
   - When configured with live `PHILSMS_API_TOKEN`:
     - Shows current live credit balance (e.g. `482 credits`)
     - Shows estimated PHP equivalent (`~PHP 241.00`)
     - Click **Refresh Balance** button to force live re-fetch with spinner animation.
