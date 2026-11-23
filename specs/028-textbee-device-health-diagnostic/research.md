# Technical Research & Architecture Decisions: TextBee Device Connection Health Diagnostic

**Feature Key**: `ARL-43`  
**Feature Slug**: `028-textbee-device-health-diagnostic`  

---

## 1. Architectural Strategy & Design Patterns

### 1.1 TextBee Health Service (`lib/services/textbee-health-service.ts`)
- **Gateway Model**: TextBee uses an on-device Android service communicating with the TextBee cloud / self-hosted control plane.
- **REST Contract**:
  - `GET ${TEXTBEE_API_URL}/devices/${TEXTBEE_DEVICE_ID}` or `GET ${TEXTBEE_API_URL}/gateway/devices`
  - Authentication: Header `x-api-key: ${TEXTBEE_API_KEY}` (or Bearer token)
  - Payload response returns:
    - `id`: string
    - `name`: string (e.g., "ARLQ Store Samsung A14")
    - `model`: string
    - `batteryLevel`: number (0-100)
    - `isCharging`: boolean
    - `networkType`: 'WIFI' | 'CELLULAR' | 'NONE'
    - `status`: 'ONLINE' | 'OFFLINE'
    - `lastSeenAt`: ISO date string
- **Resilient Fallback & In-Memory Cache**:
  - Similar to `philsms-balance-service.ts`, maintain a lightweight in-memory cache with configurable TTL (15m standard, 5m when degraded/critical).
  - Provide `_resetTextBeeHealthCache()` and `_setTestTextBeeHealthOverride()` for isolated, deterministic unit testing.
  - Implement full offline mock mode when `TEXTBEE_MOCK_HEALTH="true"` or `TEXTBEE_API_KEY` is not defined in environment.

### 1.2 Polymorphic Status Card Architecture (`components/settings/sms-status-card.tsx`)
- **Objective**: Refactor or supersede `components/settings/philsms-status-card.tsx` into a polymorphic `SmsGatewayStatusCard` (or `SmsStatusCard`).
- **Support**:
  - Can display PhilSMS telecom balance, TextBee hardware device status, or a unified/tabbed view of both when both are enabled.
  - In Reminder Settings (`/settings/reminders`), allow viewing the active gateway's diagnostics or both gateways side-by-side / stacked.
  - Keeps backward compatibility so any existing import of `PhilSmsStatusCard` continues to function seamlessly without regressions.

### 1.3 Server Actions Interface (`app/(admin)/settings/reminders/actions.ts`)
- Add:
  - `getTextBeeDeviceHealthAction()`
  - `refreshTextBeeDeviceHealthAction({ forceRefresh?: boolean })`
  - Unified `getSmsGatewayStatusAction()` that returns diagnostics for the configured SMS gateways.

### 1.4 Design System Adherence
- Strictly utilize semantic classes defined in `app/globals.css`:
  - `bg-bg-card`, `border-border`, `text-text-primary`, `text-text-muted`, `bg-bg-muted`
  - `bg-success-light`, `text-success`, `border-success-border`
  - `bg-accent-light`, `text-accent`, `border-accent-border`
  - `bg-danger-light`, `text-danger`, `border-danger-border`
- Zero arbitrary hex codes (`#...`) or standard unsemantic Tailwind colors (`text-gray-...`, `bg-blue-...`).

---

## 2. Technology Stack & Dependencies

- **Runtime**: Next.js App Router (React Server Components + Server Actions)
- **Validation**: Zod 3.x for schema parsing and contracts
- **Testing**: Node.js Test Runner (`node:test`, `node:assert/strict`)
- **Theme Support**: Universal CSS variable tokens (Light default, dark mode automatic)
