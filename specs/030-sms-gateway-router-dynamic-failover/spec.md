# Feature Specification: Pluggable Multi-Gateway Router, Dynamic Provider Switcher & Failover Strategy

**Feature Key**: `ARL-41`  
**Feature Slug**: `030-sms-gateway-router-dynamic-failover`  
**Jira Story**: STORY-6.2: Pluggable Multi-Gateway Router, Dynamic Provider Switcher & Failover Strategy  
**Epic**: EPIC-6: Mobile SIM SMS Gateway Infrastructure & Multi-Provider Telecom Delivery (TextBee)  
**Status**: Ready for Planning & Implementation  

---

## Clarifications & Defaults

- **Q: How does the provider resolution precedence order work?**  
  → **A**: 
    1. Explicit `provider` argument passed directly in dispatch options (per-call override).
    2. Explicit `SMS_GATEWAY_PROVIDER` (or legacy `ACTIVE_SMS_GATEWAY`) environment variable, case-insensitively resolved to `'textbee' | 'philsms' | 'mock'`.
    3. Smart Auto-Detection: If `TEXTBEE_API_KEY` is present and non-empty, default to `'textbee'`. Otherwise, default to `'philsms'`.
    4. Mock fallback when explicitly set (`SMS_GATEWAY_PROVIDER="mock"` or `PHILSMS_MOCK_DISPATCH="true"` without API credentials).
- **Q: What is the exact contract for `UnifiedSmsDispatchResult`?**  
  → **A**: A unified, provider-agnostic response envelope:
    ```typescript
    export interface UnifiedSmsDispatchResult {
      success: boolean;
      messageId?: string;
      provider: SmsGatewayProvider;
      errorMessage?: string;
      errorCode?: string;
      rawResponse?: unknown;
    }
    ```
- **Q: How does the router integrate with `sms-resilience.ts`?**  
  → **A**: In `dispatchSmsSafe`, instead of direct inline branching (`if (targetGateway === 'TEXTBEE') ... else ...`), execution delegates directly to `dispatchGatewaySms({ recipient, message, signal, provider })`. The returned unified result informs circuit breaker recording and retry classification.
- **Q: How is backward compatibility preserved?**  
  → **A**: Existing lower-level adapters (`sendSmsViaPhilSms`, `sendSmsViaTextBee`) and higher-level consumers (`dispatchSms`, overdue reminders queue, sales ledger) retain their signatures and contracts. All existing unit tests pass without regression.

---

## 1. User Story

**As a** software developer and systems architect,  
**I want to** implement a unified, pluggable multi-gateway router (`lib/services/sms-gateway-router.ts`) driven by dynamic provider resolution (`SMS_GATEWAY_PROVIDER`),  
**so that** the application dynamically routes outbound SMS to TextBee today, yet allows immediate, zero-code switching back to PhilSMS once their custom Sender ID is approved by telcos.

---

## 2. Context & Business Rationale

1. **Multi-Carrier Redundancy & Cost Optimization**:
   - PhilSMS provides cloud-based telco aggregation with dedicated sender ID capabilities, but carrier registration approval can take weeks.
   - TextBee routes messages through a local paired Android hardware phone with an active Philippine SIM card (Smart/Globe/DITO), offering zero-cost unlimited SMS packages.
   - A pluggable multi-gateway router abstracts carrier differences and enables dynamic switching via environment configuration.

2. **Decoupled Architecture**:
   - Decoupling gateway dispatching from resilience policies (`sms-resilience.ts`) allows each layer to focus on its single responsibility: the router handles provider selection and normalization, while the circuit breaker manages timeouts, retries, and failure containment.

3. **Zero-Code Operational Agility**:
   - Store owners and administrators can seamlessly toggle between physical SIM dispatching (TextBee) and cloud aggregator dispatching (PhilSMS) simply by changing `SMS_GATEWAY_PROVIDER` in environment settings without redeploying code.

---

## 3. Business Invariants & Domain Rules

1. **Provider Resolution Hierarchy**:
   - Provider name tokens are case-insensitive and whitespace-trimmed (`"TEXTBEE"`, `"textbee"`, `"TextBee"` $\to$ `'textbee'`).
   - If `SMS_GATEWAY_PROVIDER` is unset or invalid:
     - Check if `TEXTBEE_API_KEY` is configured: if yes, resolve to `'textbee'`.
     - Otherwise, resolve to `'philsms'`.
   - Explicit parameter override in options takes the highest precedence.

2. **Standardized Response Normalization**:
   - Regardless of underlying adapter payload structures (`PhilSmsSendResult` vs `TextBeeSendResult`), `dispatchGatewaySms()` normalizes output to `UnifiedSmsDispatchResult`.
   - `provider` is explicitly populated on the result envelope (`'textbee'`, `'philsms'`, or `'mock'`).
   - `messageId` is consistently captured (UUID for TextBee, numeric/string ID for PhilSMS, mock UUID for mock).

3. **Error Classification Continuity**:
   - Error codes from TextBee (`DEVICE_OFFLINE`, `TIMEOUT`, `GATEWAY_ERROR`, `INVALID_RECIPIENT_MOBILE`) and PhilSMS (`GATEWAY_RATE_LIMITED`, `AUTHENTICATION_ERROR`, etc.) are mapped into normalized error codes so that circuit breaker retry policies operate consistently across providers.

---

## 4. Acceptance Criteria (BDD Gherkin Scenarios)

```gherkin
Feature: Pluggable Multi-Gateway Router & Dynamic Provider Switcher (ARL-41)

  Scenario: Route Outbound SMS to TextBee Provider via Environment Variable
    Given the environment variable SMS_GATEWAY_PROVIDER is set to "textbee"
    When dispatchGatewaySms is called with a valid Philippine mobile number and message
    Then the router delegates dispatch execution to sendSmsViaTextBee
    And the returned UnifiedSmsDispatchResult has provider set to "textbee"
    And the dispatch result reflects the TextBee provider execution outcome

  Scenario: Route Outbound SMS to PhilSMS Provider via Environment Variable
    Given the environment variable SMS_GATEWAY_PROVIDER is set to "philsms"
    When dispatchGatewaySms is called with a valid Philippine mobile number and message
    Then the router delegates dispatch execution to sendSmsViaPhilSms
    And the returned UnifiedSmsDispatchResult has provider set to "philsms"
    And the dispatch result reflects the PhilSMS provider execution outcome

  Scenario: Smart Auto-Detection Defaults to TextBee when API Key is Present
    Given SMS_GATEWAY_PROVIDER is unset or empty
    And TEXTBEE_API_KEY is configured with a valid token
    When resolveSmsGatewayProvider is called without explicit options
    Then the resolved provider is "textbee"

  Scenario: Smart Auto-Detection Fallback to PhilSMS when TextBee Key is Absent
    Given SMS_GATEWAY_PROVIDER is unset or empty
    And TEXTBEE_API_KEY is not configured
    When resolveSmsGatewayProvider is called without explicit options
    Then the resolved provider is "philsms"

  Scenario: Explicit Call Option Overrides Environment Variable
    Given the environment variable SMS_GATEWAY_PROVIDER is set to "philsms"
    When dispatchGatewaySms is called with options { provider: "textbee" }
    Then the dispatch delegates to sendSmsViaTextBee rather than PhilSMS
    And the returned result indicates provider "textbee"

  Scenario: Seamless Resilience Circuit Breaker Integration
    Given the circuit breaker in sms-resilience.ts is CLOSED
    When dispatchSmsSafe is invoked for an outbound reminder
    Then dispatchSmsSafe delegates the network request to dispatchGatewaySms
    And transient gateway errors are properly classified to update circuit breaker failure counters
```

---

## 5. Scope Boundaries

- **In Scope**:
  - `lib/services/sms-gateway-router.ts`: Router interface, provider resolution logic, adapter delegation, response normalization.
  - Integration with `lib/services/sms-resilience.ts`: Refactoring `dispatchSmsSafe` to route via `dispatchGatewaySms`.
  - Comprehensive unit testing in `tests/unit/sms-gateway-router.test.ts`.
  - Non-regression verification of PhilSMS, TextBee, and audit ledger tests.

- **Out of Scope**:
  - Third gateway integrations (e.g. Twilio, Infobip, Semaphore) — the router is designed pluggable for future additions, but only TextBee and PhilSMS are implemented now.
  - UI settings modification beyond existing gateway status indicators.
