# Quickstart & Verification Guide: TextBee Device Connection Health Diagnostic

**Feature Key**: `ARL-43`  
**Feature Slug**: `028-textbee-device-health-diagnostic`  

---

## 1. Running Unit & Integration Tests

Run the test suite covering TextBee health evaluation, battery thresholds, caching TTL, mock fallback, and UI status card logic:

```bash
npm test tests/textbee-health.test.ts
```

Or run all project tests:

```bash
npm test
```

---

## 2. Interactive Manual Verification

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/settings/reminders`.
3. Verify the **SMS Gateway Status Card**:
   - In default development mode without `TEXTBEE_API_KEY`:
     - Gateway badge displays: `Mock Device Gateway (Offline Development)`
     - Battery indicator displays: `85% (Charging)`
     - Network type: `Wi-Fi Connected`
     - Last seen: timestamp within seconds
   - Click **"Refresh Connection"**:
     - The button shows spinning refresh icon with "Refreshing..."
     - Successful toast notification appears: `"TextBee device status updated"`
4. Verify theme toggling (Dark / Light mode):
   - Badges, borders, and card background adjust seamlessly using semantic tokens (`bg-bg-card`, `border-border`, `bg-success-light`, `text-success`).
