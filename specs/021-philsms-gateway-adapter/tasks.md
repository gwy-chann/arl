# Tasks: PhilSMS Gateway Adapter, Environment Secret Configuration & GSM-7 Payload Encoder (ARL-24)

**Feature Key**: `ARL-24`  
**Feature Slug**: `021-philsms-gateway-adapter`  
**Jira Story**: STORY-5.1: PhilSMS Gateway Adapter, Environment Secret Configuration & GSM-7 Payload Encoder  
**Status**: Ready for Pull Request  

---

## Phase 1: Specifications & Contracts

- [x] `T-1.1`: Create `lib/services/philsms-contracts.ts` containing:
  - Zod schemas: `philsmsSendRequestSchema`, `philsmsSendResponseSchema`, `philsmsCanonicalMobileSchema`.
  - TypeScript types: `PhilSmsSendOptions`, `PhilSmsSendResult`, `PhilSmsErrorCode`, `Gsm7EncodingSummary`, `PhilSmsMockRecord`.
  - GSM-7 and UCS-2 segment constants (160/153 characters for GSM-7, 70/67 characters for UCS-2).

---

## Phase 2: Environment Configuration

- [x] `T-2.1`: Update `.env.example` documenting:
  - `PHILSMS_API_BASE_URL` (default: `https://app.philsms.com/api/v3`)
  - `PHILSMS_API_TOKEN` (Bearer token)
  - `PHILSMS_SENDER_ID` (default: `PhilSMS`)
  - `PHILSMS_MOCK_DISPATCH` (default: `true` for development and testing)

---

## Phase 3: Core Adapter & Normalization Engine

- [x] `T-3.1`: Implement `normalizePhilippineMobileForPhilSms(mobile: string): string` canonicalizing `09...`, `+639...`, `639...`, and formatted strings into `639XXXXXXXXX`.
- [x] `T-3.2`: Implement `normalizeAndSanitizeGsm7(text: string): string` converting `₱` to `PHP `, converting typographic quotes to ASCII quotes, converting em/en-dashes to hyphens, and trimming whitespace.
- [x] `T-3.3`: Implement `calculateSmsSegments(text: string): Gsm7EncodingSummary` calculating character count, non-GSM-7 character detection, segment count, and estimated SMS credit usage.
- [x] `T-3.4`: Implement `sendSmsViaPhilSms(options: PhilSmsSendOptions): Promise<PhilSmsSendResult>` supporting:
  - Phone validation & normalization.
  - Text normalization via `normalizeAndSanitizeGsm7`.
  - Offline mock mode fallback when `PHILSMS_MOCK_DISPATCH="true"` or `PHILSMS_API_TOKEN` is unset.
  - Live HTTPS `POST` to PhilSMS API with Bearer token authentication.
  - Mapped error codes (`GATEWAY_BAD_REQUEST`, `GATEWAY_AUTH_ERROR`, `INSUFFICIENT_CREDITS`, `INVALID_RECIPIENT_MOBILE`, `GATEWAY_RATE_LIMITED`, `NETWORK_UNREACHABLE`).
- [x] `T-3.5`: Implement mock history helpers `_getPhilSmsMockHistory()` and `_resetPhilSmsMockHistory()` for test assertions.

---

## Phase 4: Unit Testing & Verification

- [x] `T-4.1`: Create `tests/philsms-adapter.test.ts` and `tests/unit/philsms-adapter.test.ts` covering all BDD Gherkin scenarios:
  - Scenario 1: Successful live SMS dispatch with valid PhilSMS credentials.
  - Scenario 2: Automatic GSM-7 normalization of Philippine Peso symbol (`₱` -> `PHP `).
  - Scenario 3: Smart punctuation and Unicode substitution (quotes, dashes).
  - Scenario 4: Offline mock dispatch in development/test environments.
  - Scenario 5: Handling invalid recipient mobile format.
  - Scenario 6: Handling PhilSMS API authentication failure (HTTP 401).
  - Scenario 7: Handling insufficient credit balance (HTTP 402).
  - Scenario 8: Handling bad request (HTTP 400), unprocessable entity (HTTP 422), rate limit (HTTP 429), and network failures.
- [x] `T-4.2`: Run tests via Node.js test runner and verify 100% pass rate (31/31 passed, 304/304 repository suite).
- [x] `T-4.3`: Verify TypeScript typecheck (`npx tsc --noEmit` passed with 0 errors).

---

## Phase 5: Convergence, Atomic Commits & Pull Request

- [x] `T-5.1`: Stage and create atomic commits following `.agents/rules/atomic-commit.md`.
- [ ] `T-5.2`: Push branch `feat/ARL-24-philsms-gateway-adapter` to origin.
- [ ] `T-5.3`: Open Pull Request with Jira linkage and complete documentation.
