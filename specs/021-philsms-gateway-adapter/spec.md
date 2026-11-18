# Feature Specification: PhilSMS Gateway Adapter, Environment Secret Configuration & GSM-7 Payload Encoder

**Feature Key**: `ARL-24`  
**Feature Slug**: `021-philsms-gateway-adapter`  
**Jira Story**: STORY-5.1: PhilSMS Gateway Adapter, Environment Secret Configuration & GSM-7 Payload Encoder  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  
**Status**: Ready for Planning & Implementation  

---

## 1. User Story

**As a** store administrator and system engineer,  
**I want to** implement a dedicated, server-isolated PhilSMS REST API v3 client adapter (`philsms-adapter.ts`) equipped with Bearer token authentication, configurable sender ID resolution, strict Philippine mobile number canonicalization, and an automated GSM-7 payload normalization engine (converting Unicode `₱` to `PHP ` and stripping UCS-2 trigger characters),  
**so that** outbound SMS reminders dispatch securely over encrypted TLS, credentials are never exposed to browser runtimes, messages strictly consume 1 SMS credit per 160 characters instead of suffering the 70-character UCS-2 billing penalty, and automated tests run reliably using offline mock fallbacks.

---

## 2. Context & Business Rationale

1. **Cellular Telco Encoding & Billing Mechanics in the Philippines**:
   - Standard cellular SMS transmissions use **GSM-7 encoding**, allowing **up to 160 characters** per credit segment (or 153 characters per concatenated segment).
   - The Philippine Peso currency symbol `₱` (`U+20B1`), along with typographer's quotes (`“ ” ‘ ’`) and em-dashes (`—`), are **not** present in the 7-bit GSM-7 basic character set or GSM-7 extension table.
   - Injecting a single `₱` symbol forces the cellular SMS gateway or carrier short message service center (SMSC) to downgrade the entire message to **UCS-2 (UTF-16)** encoding, restricting each message segment to **only 70 characters** (or 67 characters per concatenated segment).
   - *Cost Impact*: A typical 115-character overdue reminder containing `₱1,250.00` consumes **2 SMS credits** under UCS-2 instead of **1 credit** under GSM-7. For hundreds of monthly overdue notices across retail and wholesale condiment accounts, this doubles telecom operating expenses.

2. **Server-Side Secret Isolation**:
   - PhilSMS API tokens must reside strictly in server-side environment configurations (`PHILSMS_API_TOKEN`).
   - Under Next.js App Router security architecture, secret tokens must never carry the `NEXT_PUBLIC_` prefix and must never be imported into client components (`'use client'`).

3. **Deterministic Mock & Test Isolation**:
   - Automated test runs, CI runners, and local developer environments must avoid triggering actual carrier charges or external HTTP traffic.
   - A dedicated `PHILSMS_MOCK_DISPATCH` toggle enables deterministic offline dispatch with an in-memory test registry.

---

## 3. Business Invariants & Domain Rules

1. **Philippine Mobile Number Canonicalization (`639XXXXXXXXX`)**:
   - PhilSMS v3 API mandates recipient phone numbers formatted in national international prefix: `639XXXXXXXXX` (12 digits, no leading `+` or `0`).
   - The adapter must accept valid Philippine input formats:
     - `09171234567` (11 digits starting with `09`)
     - `+639171234567` (13 chars starting with `+639`)
     - `639171234567` (12 digits starting with `639`)
     - Numbers formatted with spaces, dashes, or parentheses (e.g. `(0917) 123-4567`)
   - Any input that cannot be resolved to a valid `639XXXXXXXXX` number (e.g., non-PH prefix `08...`, or less than 11 digits) must be rejected with validation error `Invalid Philippine mobile number format` before initiating HTTP dispatch.

2. **Automated GSM-7 Normalization Pipeline**:
   - Prior to calculating segment length or sending the request payload, the adapter executes sanitization:
     1. `₱` (`\u20B1`) replaced with `PHP ` (Peso symbol converted to ASCII 3-letter currency abbreviation with trailing space).
     2. `“` (`\u201C`) and `”` (`\u201D`) replaced with standard ASCII double quote `"`.
     3. `‘` (`\u2018`) and `’` (`\u2019`) replaced with standard ASCII single quote `'`.
     4. `—` (`\u2014`) and `–` (`\u2013`) replaced with standard ASCII hyphen `-`.
     5. Surrounding whitespace trimmed.
   - Character replacement must maintain legibility and preserve dollar/cent values without decimal punctuation distortion.

3. **Segment & Credit Calculation Engine**:
   - The adapter provides a character and credit calculation utility:
     - Detects whether any remaining characters fall outside GSM-7 (e.g., non-Latin scripts, emojis).
     - Standard GSM-7 character limits:
       - Single segment: $\le 160$ characters $\rightarrow 1$ credit.
       - Concatenated segments: 161–306 characters $\rightarrow 2$ credits (153 chars/segment), 307–459 characters $\rightarrow 3$ credits, etc.
     - UCS-2 fallback limits (if non-GSM-7 remains):
       - Single segment: $\le 70$ characters $\rightarrow 1$ credit.
       - Concatenated segments: 71–134 characters $\rightarrow 2$ credits (67 chars/segment), etc.
     - Returns summary object: `{ encoding, characterCount, segmentCount, estimatedCredits }`.

4. **PhilSMS v3 Endpoint Contract**:
   - Endpoint: `POST https://app.philsms.com/api/v3/sms/send` (configurable via `PHILSMS_API_BASE_URL`).
   - Headers:
     ```http
     Authorization: Bearer <PHILSMS_API_TOKEN>
     Content-Type: application/json
     Accept: application/json
     ```
   - Request JSON:
     ```json
     {
       "recipient": "639171234567",
       "sender_id": "PhilSMS",
       "type": "plain",
       "message": "ARLQ Alert: ..."
     }
     ```
   - Successful Gateway Response (HTTP 200/201):
     ```json
     {
       "status": "success",
       "message": "Message sent successfully",
       "data": {
         "uid": "648a123f4b5c6",
         "to": "639171234567",
         "message": "ARLQ Alert: ...",
         "cost": 1,
         "status": "sent"
       }
     }
     ```

5. **Server Secret Isolation & Environment Configuration**:
   - Secrets read via `process.env.PHILSMS_API_TOKEN`.
   - Never exposed through `NEXT_PUBLIC_` prefixes.
   - Default `PHILSMS_API_BASE_URL`: `https://app.philsms.com/api/v3`.
   - Default `PHILSMS_SENDER_ID`: `PhilSMS`.
   - Toggle `PHILSMS_MOCK_DISPATCH`: when `"true"` or when `PHILSMS_API_TOKEN` is unset, mock dispatch is engaged.

6. **Deterministic Offline Mock Mode**:
   - When active, no external HTTP network requests are made.
   - Adapter generates synthetic `messageId` matching format `mock_philsms_<timestamp>_<random>`.
   - Payload is recorded in an in-memory audit registry accessible for testing assertions (`_getPhilSmsMockHistory()`, `_resetPhilSmsMockHistory()`).

7. **Error Classification & Safe Failure Modes**:
   - `HTTP 400`: `GATEWAY_BAD_REQUEST` (malformed parameters / unapproved sender_id).
   - `HTTP 401`: `GATEWAY_AUTH_ERROR` (invalid or expired token).
   - `HTTP 402`: `INSUFFICIENT_CREDITS` (zero or depleted balance).
   - `HTTP 422`: `INVALID_RECIPIENT_MOBILE` (invalid or blacklisted number).
   - `HTTP 429`: `GATEWAY_RATE_LIMITED` (API rate limit exceeded).
   - Network / DNS Timeout: `NETWORK_UNREACHABLE`.

---

## 4. Clarifications

### Session 2026-11-18
- Q: What sender ID should be used if `PHILSMS_SENDER_ID` is omitted? → A: Default to `"PhilSMS"`.
- Q: How should `₱1,250.00` be normalized when no space follows the symbol? → A: `replace(/\u20B1/g, 'PHP ')` ensuring clear separation between currency code and numbers (e.g. `PHP 1,250.00`).
- Q: When should mock dispatch trigger automatically? → A: When `PHILSMS_MOCK_DISPATCH === "true"` OR when `PHILSMS_API_TOKEN` is empty/undefined.
- Q: What is the concatenated GSM-7 segment step? → A: 160 characters for single segment; 153 characters per segment for multi-part concatenated SMS (161–306 = 2 segments, 307–459 = 3 segments).

---

## 5. Gherkin Acceptance Criteria

```gherkin
Feature: PhilSMS Gateway Adapter and GSM-7 Encoder (ARL-24)

  Scenario: Successful live SMS dispatch with valid PhilSMS credentials
    Given a configured environment with valid PHILSMS_API_TOKEN
    And a valid recipient mobile number "09171234567"
    And an SMS text "ARLQ Alert: Settle PHP 450 balance"
    When the adapter dispatches the SMS payload
    Then it issues an HTTPS POST to "https://app.philsms.com/api/v3/sms/send"
    And the request body contains recipient "639171234567" and sender_id "PhilSMS"
    And the authorization header includes the bearer token
    And the returned result indicates success with the gateway message ID "648a123f4b5c6"

  Scenario: Automatic GSM-7 normalization of Philippine Peso symbol
    Given an outbound message containing "Total utang: ₱1,500.00 for Receipt #0012"
    When the message passes through the normalizeAndSanitizeGsm7 encoder
    Then all occurrences of "₱" are replaced with "PHP "
    And the resulting message is "Total utang: PHP 1,500.00 for Receipt #0012"
    And the character encoding is classified as GSM-7 with a single message segment

  Scenario: Smart punctuation and Unicode substitution
    Given an outbound message containing curly quotes “ARLQ” and em-dash —
    When the message passes through the normalizeAndSanitizeGsm7 encoder
    Then curly quotes are replaced with standard ASCII quotes
    And the em-dash is replaced with a single hyphen "-"
    And no non-GSM-7 characters remain in the payload

  Scenario: Offline mock dispatch in development and test environments
    Given an environment where PHILSMS_MOCK_DISPATCH is "true" or PHILSMS_API_TOKEN is unset
    When the dispatch function is called with recipient "09181234567" and message "Test message"
    Then no outbound network HTTP request is made to app.philsms.com
    And the adapter records the dispatched payload in the in-memory test registry
    And returns a successful response with messageId prefixed with "mock_philsms_"

  Scenario: Handling invalid recipient mobile format
    Given a recipient phone number "091234"
    When the adapter attempts to dispatch the SMS
    Then the validation fails before making any HTTP request
    And returns an error object with reason "Invalid Philippine mobile number format"

  Scenario: Handling PhilSMS API authentication failure (HTTP 401)
    Given an invalid or expired PHILSMS_API_TOKEN
    When the adapter sends an SMS payload
    Then the PhilSMS endpoint returns HTTP 401 Unauthorized
    And the adapter captures the error and returns success: false with error code "GATEWAY_AUTH_ERROR"

  Scenario: Handling Insufficient Balance (HTTP 402)
    Given a PhilSMS account with zero credit balance
    When an outbound SMS is dispatched
    Then the gateway returns HTTP 402 Payment Required
    And the adapter captures the response and returns error code "INSUFFICIENT_CREDITS"
```

---

## 6. Failure Modes & Error Handling Matrix

| HTTP Status / Condition | Root Cause | Adapter Error Code | Client / Caller Impact |
| :--- | :--- | :--- | :--- |
| **HTTP 400 Bad Request** | Malformed parameters or unsupported sender_id | `GATEWAY_BAD_REQUEST` | Logs warning; disables retry |
| **HTTP 401 Unauthorized** | Missing, malformed, or invalid `PHILSMS_API_TOKEN` | `GATEWAY_AUTH_ERROR` | Flags credential failure in admin logs |
| **HTTP 402 Payment Required** | Zero or insufficient PhilSMS credits | `INSUFFICIENT_CREDITS` | Suppresses further dispatches; alerts admin |
| **HTTP 422 Unprocessable** | Telco-level blacklisted number or invalid format | `INVALID_RECIPIENT_MOBILE` | Marks recipient as unreachable |
| **HTTP 429 Too Many Requests** | Rate limit exceeded on PhilSMS API | `GATEWAY_RATE_LIMITED` | Eligible for backoff retry |
| **DNS / Network Failure** | Server cannot resolve or reach gateway host | `NETWORK_UNREACHABLE` | Caught by resilience engine |
