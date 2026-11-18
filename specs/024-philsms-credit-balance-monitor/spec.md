# Feature Specification: PhilSMS Credit Balance Monitor, Low-Balance Threshold Alert & Health Diagnostic

**Feature Key**: `ARL-27`  
**Feature Slug**: `024-philsms-credit-balance-monitor`  
**Jira Story**: STORY-5.4: PhilSMS Credit Balance Monitor, Low-Balance Threshold Alert & Health Diagnostic  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  
**Status**: Ready for Planning & Implementation  

---

## Clarifications

### Session 2026-11-18
- Q: What constitutes the estimated Peso value conversion rate for PhilSMS credits? → A: In PhilSMS prepaid pricing tiers, credits cost between ₱0.40 and ₱0.50. A standard conversion baseline of ₱0.50 per credit (`credits * 0.50`) formatted as `~PHP X.XX` is used for display in the UI.
- Q: How does the server-side cache behave between critical (< 10 credits) and standard (≥ 50 credits) states? → A: Standard balances and warning balances (≥ 10 credits) are cached for 15 minutes (900 seconds). When a balance is detected below 10 credits, the cache TTL is reduced to 5 minutes (300 seconds) to ensure prompt balance recovery detection upon merchant top-up.
- Q: What happens when the external PhilSMS endpoint is unreachable or returns a 5xx error? → A: The service returns the last known cached balance with a warning indicator (`status: 'stale'`) if available, or returns a graceful gateway error state with actionable guidance without throwing an uncaught exception or crashing the settings page.

---

## 1. User Story

**As a** store administrator,  
**I want to** view live PhilSMS prepaid credit balances, gateway connectivity health, and verified Sender ID status directly from the Reminder Settings dashboard (`/settings/reminders`), with automated warning banners when remaining balance dips below 50 credits,  
**so that** store management can proactively top up SMS credits via GCash/Maya before automated daily overdue sweeps halt due to depleted telecom credits.

---

## 2. Context & Business Rationale

1. **Prepaid Telecom Credit Depletion Risk**:
   - PhilSMS operates on a prepaid credit model (typically ~₱0.40 to ₱0.50 per SMS credit).
   - If the account balance drops to zero, automated overdue balance sweeps fail silently or abort, resulting in uncollected credit receivables (*pautang*) and stalled cash collections.
   - Store owners and administrators should not be forced to log in to an external telecom portal (`app.philsms.com`) simply to verify credit solvency.

2. **Proactive Operational Warning Thresholds**:
   - At a 50-credit threshold (approx. ₱25.00), the system displays a prominent visual warning banner, granting the business several days of lead time to top up before sweeps are impacted.
   - At a 10-credit threshold (approx. ₱5.00), a critical warning badge is displayed across the Reminder Settings to alert that scheduled sweeps will soon fail.

3. **Performance & Rate Limit Mitigation**:
   - Frequent settings page reloads should not consume PhilSMS rate limits or add 300ms network latency to the Next.js page render.
   - The balance response is cached in server memory for 15 minutes (900s), with an on-demand "Refresh Balance" action providing immediate cache invalidation.

4. **Zero Hardcoded Colors & Theme Cohesion**:
   - The balance monitoring card must strictly adhere to the ARLQ design system defined in `AGENTS.md` and `app/globals.css`, using semantic utility classes (`bg-success-light`, `text-success`, `bg-accent-light`, `text-accent`, `bg-danger-light`, `text-danger`, `bg-bg-card`, `border-border`) with universal dark mode support.

---

## 3. Business Invariants & Domain Rules

1. **Health Threshold Invariants**:
   - `HEALTHY`: Balance ≥ 50 credits. Status badge displays `Connected (PhilSMS Gateway)` in semantic success tokens. No warning banner shown.
   - `LOW_BALANCE`: Balance < 50 credits and ≥ 10 credits. Accent warning banner displayed with text prompting top-up.
   - `CRITICAL`: Balance < 10 credits. Danger alert banner displayed warning that scheduled sweeps will soon fail.
   - `MOCK`: `PHILSMS_MOCK_DISPATCH="true"` or `PHILSMS_API_TOKEN` is unset. Muted badge displays `Mock Gateway Mode (Offline Development)` with `Unlimited (Local Mock)` credits.
   - `ERROR`: External gateway returned 401 Unauthorized or network failure without prior cache. Danger badge displays error status with actionable config guidance.

2. **Caching Policy Invariants**:
   - Default cache TTL: 15 minutes (900,000 ms).
   - Critical cache TTL (< 10 credits): 5 minutes (300,000 ms).
   - Forced refresh flag (`forceRefresh: true`): Invalids cache immediately and triggers live GET request to `https://app.philsms.com/api/v3/balance`.

3. **Currency & Conversion Rules**:
   - Currency is PHP.
   - Estimated peso equivalent calculated as `balance * 0.50`.

4. **Gateway Endpoint Specification**:
   - Endpoint: `GET ${PHILSMS_BASE_URL}/balance` (default base: `https://app.philsms.com/api/v3`).
   - Headers: `Authorization: Bearer <PHILSMS_API_TOKEN>`, `Accept: application/json`.

---

## 4. Acceptance Criteria (BDD Gherkin Scenarios)

```gherkin
Feature: PhilSMS Credit Balance Monitor and Health Diagnostic (ARL-27)

  Scenario: Render healthy PhilSMS credit balance in settings
    Given an authenticated admin viewing "/settings/reminders"
    And the PhilSMS account has 482 remaining credits
    When the page renders
    Then the PhilSMS Status Card displays "482 credits" with estimated value "~PHP 241.00"
    And the gateway badge displays "Connected (PhilSMS Gateway)" in semantic success tokens
    And no low-balance warning banner is visible

  Scenario: Low balance threshold alert triggered at 49 credits
    Given an authenticated admin viewing "/settings/reminders"
    And the PhilSMS account has 49 remaining credits
    When the page renders
    Then a prominent warning banner is displayed with semantic accent tokens
    And the text reads "Low SMS Credit Balance: 49 credits remaining (~PHP 24.50). Top up via PhilSMS to prevent sweep failures."

  Scenario: Critical balance alert triggered at 5 credits
    Given an authenticated admin viewing "/settings/reminders"
    And the PhilSMS account has 5 remaining credits
    When the page renders
    Then a critical alert banner is displayed with semantic danger tokens
    And the text alerts the admin that scheduled sweeps will soon fail

  Scenario: Balance caching prevents redundant external API calls
    Given the admin loaded "/settings/reminders" 2 minutes ago
    When the admin navigates away and re-opens "/settings/reminders"
    Then the cached balance is displayed immediately without issuing an HTTP request to app.philsms.com

  Scenario: Manual balance refresh forces live API fetch
    Given an admin has just topped up 500 credits on PhilSMS
    When the admin clicks "Refresh Balance" in the UI
    Then the server cache is invalidated
    And a fresh request is sent to "https://app.philsms.com/api/v3/balance"
    And the card immediately updates to show the updated credit total

  Scenario: Fallback display in Mock Mode
    Given an environment where PHILSMS_API_TOKEN is not configured
    When the admin views the Reminder Settings
    Then the card displays "Mock Gateway Mode (Offline Development)"
    And the credit indicator displays "Unlimited (Local Mock)"

  Scenario: Graceful degradation on gateway auth failure (HTTP 401)
    Given an invalid or expired PHILSMS_API_TOKEN
    When the balance is requested
    Then the card displays an error badge "Gateway Authentication Failed"
    And actionable guidance prompts the administrator to verify the PHILSMS_API_TOKEN secret
```
