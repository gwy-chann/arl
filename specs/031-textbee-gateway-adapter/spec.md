# Feature Specification: TextBee REST Gateway Client Adapter, Canonical Phone Normalizer & Mock Engine

**Feature Key**: `ARL-40`  
**Feature Slug**: `031-textbee-gateway-adapter`  
**Jira Story**: STORY-6.1: TextBee REST Gateway Client Adapter, Canonical Phone Normalizer & Mock Engine  
**Status**: Ready for Planning & Implementation  

---

## 1. User Story

**As a** store administrator and system engineer,  
**I want to** implement a dedicated, server-isolated TextBee REST API client adapter (`lib/services/textbee-adapter.ts`) with strict Philippine phone canonicalization, payload encoding sanitization, and deterministic offline mock fallbacks,  
**so that** outbound SMS reminders dispatch securely through our paired Android phone SIM without carrier Sender ID vetting delays, credentials remain strictly isolated on the server, and CI/local tests execute offline without carrier costs.

---

## 2. Context & Business Rationale

1. **Direct Android GSM Delivery via TextBee**:
   - Traditional SMS aggregators often require weeks of telco registration and strict corporate KYC verification for dedicated Sender IDs.
   - TextBee bridges our Next.js backend with a paired physical Android smartphone acting as an SMS gateway. Outbound dispatches are routed over HTTPS to the TextBee REST API, which forwards the message to the Android device application for physical SIM transmission.
   - This provides instant zero-delay SMS delivery for customer overdue balance reminders, order confirmations, and collection alerts.

2. **Strict Philippine Mobile Number Canonicalization**:
   - Unlike aggregator APIs that might expect local `09XX` or unadorned `639XX` prefixes, TextBee requires canonical E.164 format: `+639XXXXXXXXX` (13 characters including leading `+`).
   - Philippine mobile numbers entered into POS or customer profiles occur in various formats:
     - `09171234567` (11-digit local mobile format)
     - `639171234567` (12-digit international format without leading plus)
     - `+639171234567` (13-character E.164 format)
     - Formats with whitespace, hyphens, and parentheses: `(0917) 123-4567`, `0917-123-4567`
   - The adapter must normalize all valid Philippine mobile numbers to `+639XXXXXXXXX` and reject invalid patterns before any network call.

3. **Server-Side Secret Isolation & Security**:
   - `TEXTBEE_API_KEY`, `TEXTBEE_DEVICE_ID`, and `TEXTBEE_BASE_URL` must remain strictly server-isolated.
   - Secrets must never be exposed with `NEXT_PUBLIC_` prefixes or imported into client components (`'use client'`).

4. **Deterministic Mock & Offline Testing**:
   - Automated CI pipelines, unit test suites, and local development environments must execute without requiring a physical connected Android phone or live network access.
   - When `TEXTBEE_MOCK_DISPATCH="true"` or when credentials are not configured, the adapter operates in deterministic mock mode, logging dispatches to an in-memory inspection registry (`_getTextBeeMockHistory()`) without throwing unexpected network errors.

---

## 3. Business Invariants & Acceptance Criteria

### Scenario 1: Live Dispatch via TextBee REST API
- **Given** valid `TEXTBEE_API_KEY` and `TEXTBEE_DEVICE_ID` configured in the server environment
- **When** `sendSmsViaTextBee({ recipient: "09171234567", message: "Your order is ready" })` is invoked
- **Then** it canonicalizes the recipient to `+639171234567`
- **And** it dispatches an authorized HTTPS POST request with `x-api-key: <TEXTBEE_API_KEY>` to the TextBee device endpoint
- **And** it returns `{ success: true, messageId: "<id>", recipient: "+639171234567", gateway: "TEXTBEE" }`.

### Scenario 2: Deterministic Mock Mode
- **Given** `TEXTBEE_MOCK_DISPATCH="true"` or unconfigured `TEXTBEE_API_KEY`
- **When** any SMS dispatch is executed
- **Then** zero external HTTP requests are made
- **And** a synthetic unique message ID (`textbee_...`) is generated
- **And** the dispatch record is appended to the in-memory mock history (`_getTextBeeMockHistory()`)
- **And** it returns `{ success: true, messageId: "textbee_...", recipient: "+639XXXXXXXXX", gateway: "TEXTBEE" }`.

### Scenario 3: Philippine Mobile Number Canonicalization
- **Given** mobile number inputs in varied valid formats (`09181234567`, `+639181234567`, `639181234567`, `(0918) 123-4567`)
- **When** `normalizePhilippineMobileForTextBee()` is invoked
- **Then** all produce canonical `+639181234567`.
- **Given** non-Philippine numbers, landlines, or malformed strings (`08123456789`, `12345`, `abcdef`)
- **When** validation or normalization runs
- **Then** an explicit error is returned or thrown with code `INVALID_RECIPIENT_MOBILE`.

### Scenario 4: Error Classification & Timeout Handling
- **Given** a network failure, gateway HTTP status (401, 403, 404, 500, 503), or AbortSignal timeout
- **When** `sendSmsViaTextBee()` catches or handles the failure
- **Then** it classifies the error into standardized `TextBeeErrorCode`:
  - `401` / `403` $\to$ `GATEWAY_AUTH_ERROR`
  - `404` $\to$ `DEVICE_NOT_FOUND`
  - `503` / device offline response $\to$ `DEVICE_OFFLINE`
  - `400` / `422` $\to$ `GATEWAY_BAD_REQUEST`
  - `429` $\to$ `GATEWAY_RATE_LIMITED`
  - AbortSignal timeout $\to$ `TIMEOUT`
  - Network unreachable $\to$ `NETWORK_UNREACHABLE`
  - Other 5xx $\to$ `GATEWAY_SERVER_ERROR`.

---

## 4. Technical Contracts & Signatures

```typescript
export interface TextBeeSendOptions {
  recipient: string;
  message: string;
  signal?: AbortSignal;
  apiKey?: string;
  deviceId?: string;
  baseUrl?: string;
}

export interface TextBeeSendResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  gateway: 'TEXTBEE';
  errorCode?: TextBeeErrorCode;
  errorMessage?: string;
  rawResponse?: unknown;
}
```

---

## 5. Definition of Done (DoD)

1. Strict TypeScript compilation with zero type errors.
2. 100% test pass rate in `tests/unit/textbee-adapter.test.ts`.
3. Existing unit test suites (`tests/unit/textbee-health.test.ts`, `tests/textbee-resilience.test.ts`) remain 100% passing.
4. `TEXTBEE_API_KEY` and `TEXTBEE_DEVICE_ID` verified absent from client component bundles.
5. Environment variables documented in `.env.example`.
