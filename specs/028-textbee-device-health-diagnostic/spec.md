# Feature Specification: TextBee Device Connection Health Diagnostic, Battery Monitor & Settings Status Card

**Feature Key**: `ARL-43`  
**Feature Slug**: `028-textbee-device-health-diagnostic`  
**Jira Story**: STORY-6.4: TextBee Device Connection Health Diagnostic, Battery Monitor & Settings Status Card  
**Epic**: EPIC-6: Alternative SMS Gateway & Physical Device Resilience (TextBee)  
**Status**: Ready for Planning & Implementation  

---

## Clarifications & Defaults

- **Q: What constitutes a critical battery threshold for the physical Android SMS gateway?**  
  → **A**: When the device battery level dips below 10% (and is not actively charging), the status card raises a `CRITICAL` alert with red pulsing indicator, warning the store manager that outbound SMS alerts will cease once the phone turns off.
- **Q: What constitutes a low battery warning threshold?**  
  → **A**: When battery level is between 10% and 19% (or when discharging below 20%), a `WARNING` banner is shown advising staff to plug the phone into a charger.
- **Q: How does offline detection work when TextBee gateway or phone cannot be reached?**  
  → **A**: If the last ping / heartbeat timestamp is older than 30 minutes, or if the API reports the device disconnected, or if the network request fails without cache, the device status is flagged as `OFFLINE` with actionable recovery instructions.
- **Q: How are mock / local environments handled?**  
  → **A**: When `TEXTBEE_MOCK_HEALTH="true"` or `TEXTBEE_API_KEY` is not configured, the service returns a high-fidelity mock status (Online, 85% Battery, Charging, Wi-Fi Connected) with a `(Local Mock)` indicator to ensure deterministic local development and automated CI testing.

---

## 1. User Story

**As a** store manager and system administrator,  
**I want to** view real-time Android device connectivity, battery percentage, charging state, and gateway health on the `/settings/reminders` admin page,  
**so that** I can immediately verify that our physical SMS gateway phone is powered on, connected to cellular data/Wi-Fi, and ready to dispatch customer alerts.

---

## 2. Context & Business Rationale

1. **Physical Hardware Failure Modes**:
   - Unlike cloud telecom aggregators that fail only due to depleted credits or carrier downtime, an on-premise Android gateway phone (TextBee) is subject to physical vulnerabilities: power unplugged, drained battery, Android battery-saver sleep mode, or lost Wi-Fi/cellular signal.
   - Without an integrated health dashboard, the store only discovers a dead gateway phone days later when overdue balance reminders fail to send and customer accounts remain unsettled.

2. **Proactive Operational Visibility**:
   - The `/settings/reminders` dashboard serves as the administrative mission control for customer notifications.
   - Placing the TextBee Device Health Diagnostic on this page gives store operators immediate peace of mind and one-click manual connection refreshing.

3. **Polymorphic Gateway Architecture**:
   - The application previously supported only PhilSMS. As ARLQ expands to dual or alternate gateways, the UI status card must support polymorphic presentation: displaying telecom credit balance for cloud aggregators (PhilSMS) and device hardware health (battery, network, ping) for phone gateways (TextBee).

4. **Zero Hardcoded Colors & Universal Theme Support**:
   - The component must strictly honor ARLQ semantic design tokens (`bg-bg-card`, `border-border`, `text-text-primary`, `bg-success-light`, `text-success`, `bg-accent-light`, `text-accent`, `bg-danger-light`, `text-danger`), ensuring full high-contrast accessibility in both light and dark modes.

---

## 3. Business Invariants & Domain Rules

1. **Device Health Status Classification**:
   - `ONLINE`: Device is connected, last heartbeat within 15 minutes, battery $\ge 20\%$ or actively charging.
   - `WARNING`: Device is online but battery is low ($10\% \le \text{battery} < 20\%$ while discharging) or last heartbeat is between 15 and 30 minutes ago.
   - `CRITICAL`: Device is offline, battery $< 10\%$ while discharging, or last heartbeat $> 30$ minutes ago.
   - `MOCK`: `TEXTBEE_MOCK_HEALTH="true"` or `TEXTBEE_API_KEY` is unset. Displays `Mock Device Gateway (Offline Development)`.
   - `ERROR`: Gateway API credentials invalid or unreachable without cached state.

2. **Battery State Invariants**:
   - Battery level is an integer between 0 and 100.
   - Charging state boolean indicates whether AC/USB power is currently supplying the phone.
   - If `isCharging: true`, low battery warnings do not elevate to critical because power is being replenished.

3. **Caching & Refresh Policy**:
   - Standard cache TTL: 15 minutes (900,000 ms).
   - Degraded / Critical cache TTL: 5 minutes (300,000 ms) when battery $< 20\%$ or device is offline.
   - Manual `forceRefresh: true` bypasses cache and triggers real-time query to TextBee API.

4. **Polymorphic UI Status Card**:
   - `SmsGatewayStatusCard` can render PhilSMS account status or TextBee device health status, or accept a combined gateway diagnostic object.
   - Manual "Refresh Connection" button triggers the corresponding server action with toast feedback.

---

## 4. Acceptance Criteria (BDD Gherkin Scenarios)

```gherkin
Feature: TextBee Device Connection Health Diagnostic & Status Card (ARL-43)

  Scenario: Display online Android device health with normal battery
    Given an authenticated admin viewing "/settings/reminders"
    And the TextBee gateway phone is online with 85% battery and charging via AC
    When the settings page renders
    Then the status card displays "Connected (TextBee Gateway)" with semantic success badge
    And the battery indicator displays "85% (Charging)"
    And the network status displays "Wi-Fi Connected"
    And no warning banners are displayed

  Scenario: Display warning banner when battery dips below 20% while discharging
    Given an authenticated admin viewing "/settings/reminders"
    And the TextBee gateway phone has 18% battery and is discharging
    When the settings page renders
    Then a warning banner is displayed with semantic accent tokens
    And the banner instructs staff to plug the phone into a charger
    And the status badge displays "Low Battery Warning"

  Scenario: Display critical alert when device is offline or battery critical
    Given an authenticated admin viewing "/settings/reminders"
    And the TextBee gateway phone has not reported a ping in over 30 minutes
    When the settings page renders
    Then a critical alert banner is displayed with semantic danger tokens
    And the status badge displays "Device Offline" with a danger border
    And actionable guidance prompts the user to check the physical phone

  Scenario: Manual connection refresh via server action
    Given the admin is on "/settings/reminders"
    When the admin clicks the "Refresh Connection" button
    Then a loading spinner is displayed during the transition
    And the device health is fetched with cache bypassed
    And a toast notification confirms "TextBee device status updated"

  Scenario: Mock mode fallback in offline development
    Given the application runs without TEXTBEE_API_KEY set
    When the settings page renders
    Then the status card indicates "Mock Device Mode (Offline Development)"
    And the battery displays "85% (Local Mock)"
```
