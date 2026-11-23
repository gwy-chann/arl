# Technical Research & Architectural Decisions: TextBee REST Gateway Client Adapter

**Feature Key**: `ARL-40`  
**Feature Slug**: `031-textbee-gateway-adapter`  

---

## 1. Stack Constraints & Integration Landscape

- **Runtime**: Node.js 20+ / Next.js 16+ App Router (Server-side services only).
- **HTTP Client**: Native `fetch` with `AbortSignal` deadline propagation.
- **Validation**: Zod 3.x schema validation for runtime boundaries.
- **Environment**: Next.js server environment via `process.env`.
- **Test Framework**: Vitest / Node test runner (`npm test`).

---

## 2. Architectural Decisions & Rationales

### Decision 1: Canonical E.164 Philippine Mobile Number Normalization
- **Choice**: Canonicalize all valid Philippine mobile numbers to `+639XXXXXXXXX` (13 characters).
- **Rationale**:
  - The TextBee Android SMS Gateway app relays messages to the native Android TelephonyManager/SMSManager.
  - Android SMSManager accepts both international E.164 format and local formats, but international carriers and Android SIM routing reliably route `+639` to Smart, Globe, and DITO SIM cards without ambiguous zero-prefix stripping.
  - Reject non-PH numbers immediately with `INVALID_RECIPIENT_MOBILE` to prevent SIM carrier surcharge penalties.

### Decision 2: In-Memory Mock Registry for Deterministic Testing
- **Choice**: Implement `_getTextBeeMockHistory()` and `_resetTextBeeMockHistory()` in `lib/services/textbee-adapter.ts`.
- **Rationale**:
  - Consistent with the PhilSMS adapter architecture (`lib/services/philsms-adapter.ts`), an in-memory mock history queue enables unit tests, integration tests, and E2E runs to inspect dispatched messages without invoking external APIs or requiring complex network stubs.
  - Retain `_setMockTextBeeSendHandler` and `_resetTextBeeSendMock` to preserve backward compatibility with resilience tests in `tests/textbee-resilience.test.ts`.

### Decision 3: Standardized Result Contract Alignment (`gateway: 'TEXTBEE'`, `recipient`)
- **Choice**: Return `TextBeeSendResult` with `gateway: 'TEXTBEE'` and `recipient: string`.
- **Rationale**:
  - Upstream SMS Gateway Routers (`lib/services/sms-gateway-router.ts` and `UnifiedSmsDispatchResult`) consume the result object and require identifying the executing gateway and the normalized recipient.
  - Providing `gateway: 'TEXTBEE'` and normalized `recipient` guarantees type safety and consistency across both PhilSMS and TextBee adapters.

### Decision 4: Endpoint URL Path Handling
- **Choice**: Support standard TextBee REST API paths (`/gateway/devices/{DEVICE_ID}/sendSMS` or `/gateway/devices/{DEVICE_ID}/send-sms`).
- **Rationale**:
  - The TextBee cloud documentation documents `sendSMS` (and in some OpenAPI references `send-sms`). Normalizing the default URL to `${baseUrl}/gateway/devices/${encodeURIComponent(deviceId)}/sendSMS` matches both the existing codebase and TextBee's primary REST route.
