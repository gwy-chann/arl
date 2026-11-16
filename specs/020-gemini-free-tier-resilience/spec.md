# Feature Specification: Gemini Free-Tier Resilience, Context Pruning & Rate Limit Handling

**Feature Key**: `ARL-34`  
**Feature Slug**: `020-gemini-free-tier-resilience`  
**Jira Story**: STORY-6.5: Gemini Free-Tier Resilience, Context Pruning & Rate Limit Handling  
**Parent Epic**: EPIC-6: In-App AI Operational Assistant (Gemini Flash Free Tier) (`ARL-29`)  
**Status**: Ready for Planning  

---

## 1. User Story

* **As an** ARLQ store administrator,
* **I want** the chat assistant to handle free-tier API quotas, token limits, and network anomalies gracefully with context pruning and polite fallbacks,
* **so that** the application remains fully stable and responsive without UI freezes, unhandled crashes, or cryptic error codes.

---

## 2. Business Value & Technical Rationale

The ARLQ assistant operates under Google AI Studio's Free Tier for Gemini 2.0 Flash:
* **Quota Constraints**: 15 Requests Per Minute (RPM), 1,000,000 Tokens Per Minute (TPM), and 1,500 Requests Per Day (RPD).
* **Risks Without Resilience**:
  * Unchecked conversation history depletes token limits rapidly over long administrative sessions.
  * Rapid consecutive submissions trigger HTTP 429 (`RESOURCE_EXHAUSTED`) status codes.
  * An unset `GEMINI_API_KEY` or temporary upstream outages can crash the UI or throw unhandled 500 exceptions.
  * Slow network requests leave the administrator wondering if the assistant hung.

Implementing server-side context pruning, structured upstream error mapping, request timeout control, client-side input locking, and inline error recovery guarantees an enterprise-grade user experience while maximizing the longevity and stability of free-tier quotas.

---

## 3. Resilience & Context Pruning Architecture

### 3.1 Context Pruning (Sliding Window Mechanism)
* **Turn Retention Window**: The backend retains only the **last 6 message turns** (3 user inputs and 3 assistant replies) before passing history to the Gemini API.
* **Core Invariant**: Older conversational turns are cleanly dropped, while the top-level `ARLQ_SYSTEM_INSTRUCTION` remains permanently prepended as the system instruction.
* **Function Signature**:
  ```typescript
  export function pruneConversationHistory<T extends { role: string; content: string }>(
    messages: T[],
    maxTurns = 6
  ): T[] {
    if (messages.length <= maxTurns) {
      return messages;
    }
    return messages.slice(-maxTurns);
  }
  ```

### 3.2 Upstream Error Mapping & HTTP Status Handlers
The route handler (`app/api/chat/route.ts`) wraps all external Gemini invocations in structured error detection with exact zero-emoji messaging:

| Error Type / Condition | Detection Trigger | Client Error Message (Strict Zero-Emoji) | HTTP Status Code |
| :--- | :--- | :--- | :--- |
| **Missing API Key** | `!process.env.GEMINI_API_KEY` | "The store assistant is not configured. Please configure GEMINI_API_KEY in the environment settings." | `503 Service Unavailable` |
| **Rate Limit / Quota Exhaustion** | HTTP 429 or `RESOURCE_EXHAUSTED` in response body/error | "The store assistant is receiving high request traffic. Please wait 30 seconds before sending another question." | `429 Too Many Requests` |
| **Request Timeout** | Request duration > 15s (`AbortController` / timeout signal) | "The request timed out while checking store records. Please try again." | `504 Gateway Timeout` |
| **Upstream Outage** | HTTP 500, 502, 503 from Google Generative Language API | "The store assistant service is temporarily unavailable. Please try again shortly." | `503 Service Unavailable` |
| **Generic Exception** | Uncaught runtime error / malformed response | "An unexpected error occurred while processing your request. Please try again." | `500 Internal Server Error` |

### 3.3 Client-Side Debouncing & Loading States
* **Input Locking**: While `status === 'loading'`, the input text area and the Send button are explicitly disabled (`disabled={status === 'loading'}`).
* **Empty Submission Guard**: The submit action strictly requires non-whitespace content (`content.trim().length > 0`).
* **Visual Status Indicator**: During active retrieval, renders an understated inline indicator:
  `Checking store records...` with an animated pulse dot using semantic tokens (`text-text-muted text-xs`).
* **Inline Error Recovery**: Errors render in the chat stream as an operational notice (`text-danger text-xs bg-danger-light border border-danger-border rounded-md p-2.5`) accompanied by a "Retry" button. Clicking "Retry" re-triggers submission of the last failed user query.

---

## 4. Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Sliding Window Context Pruning
* **Given** an active chat session with 10 existing message turns
* **When** the administrator submits an 11th question
* **Then** the chat API route trims the conversational history to the 6 most recent message turns before sending to Gemini
* **And** prepends the system instruction without exceeding free-tier token allowances.

### Scenario 2: Prevention of Duplicate Submissions During In-Flight Requests
* **Given** a query currently in flight with status `loading`
* **When** the user attempts to click the Send button or press Enter
* **Then** the submission is blocked
* **And** the Send button remains disabled with the visual indicator `"Checking store records..."`.

### Scenario 3: Graceful HTTP 429 Quota Exhaustion Handling
* **Given** Google AI Studio returns HTTP 429 (`RESOURCE_EXHAUSTED`)
* **When** the backend receives the error
* **Then** the route catches the error and returns a clean HTTP 429 JSON response
* **And** the chat widget displays `"The store assistant is receiving high request traffic. Please wait 30 seconds before sending another question."`
* **And** the UI does not freeze, crash, or show an unhandled React error boundary.

### Scenario 4: Missing GEMINI_API_KEY Environment Notice
* **Given** an environment where `GEMINI_API_KEY` is missing or empty
* **When** any query is submitted to `/api/chat`
* **Then** the system returns HTTP 503 with the friendly configuration notice:
  `"The store assistant is not configured. Please configure GEMINI_API_KEY in the environment settings."`
* **And** instructs the administrator to configure the key in the environment settings.

### Scenario 5: Timeout & Network Interruption Recovery
* **Given** a slow network connection where the API response exceeds 15 seconds
* **When** the AbortController triggers
* **Then** the request is cancelled cleanly
* **And** the client displays a timeout notification with a one-click "Retry" option:
  `"The request timed out while checking store records. Please try again."`

---

## 5. Non-Functional & Architecture Invariants

1. **Strict Zero-Emoji Policy**: Under no condition may any error notification, timeout warning, or status message contain emoji or pictorial symbols.
2. **Zero Hardcoded Colors**: All error boxes, indicator dots, and retry buttons must strictly consume semantic classes (`bg-danger-light`, `text-danger`, `border-danger-border`, `text-text-muted`, `bg-primary`, `hover:bg-primary-hover`).
3. **Resilience Isolation**: Errors originating from upstream Gemini or network timeouts must never bubble up into unhandled promise rejections or white-screen React error boundaries.
4. **State Machine Integrity**: Assistant status transitions strictly follow: `idle -> loading -> idle | error`. When in `error`, the administrator can retry or type a new query to reset to `loading -> idle`.
