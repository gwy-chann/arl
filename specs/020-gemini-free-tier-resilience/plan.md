# Technical Implementation Plan: Gemini Free-Tier Resilience, Context Pruning & Rate Limit Handling

**Feature Key**: `ARL-34`  
**Feature Slug**: `020-gemini-free-tier-resilience`  

---

## 1. Architectural Strategy & Modular Breakdown

### 1.1 Resilience Module (`lib/assistant/assistant-resilience.ts`)
- Implement `pruneConversationHistory(messages, maxTurns = 6)`:
  - If `messages.length <= maxTurns`, return `messages`.
  - Otherwise return `messages.slice(-maxTurns)`.
- Implement error constants:
  - `MISSING_API_KEY_MESSAGE`
  - `RATE_LIMIT_MESSAGE`
  - `TIMEOUT_MESSAGE`
  - `UPSTREAM_OUTAGE_MESSAGE`
  - `GENERIC_ERROR_MESSAGE`
- Implement `mapGeminiError(errorOrStatus, responseBody?: string)` to map errors to `{ status: number, message: string }`.

### 1.2 Route Handler Upgrades (`app/api/chat/route.ts`)
- Export `pruneConversationHistory` from `app/api/chat/route.ts` (re-export or implement directly as mandated by DoD).
- Check `process.env.GEMINI_API_KEY`:
  - If unset and not in offline simulation, return HTTP 503 with `MISSING_API_KEY_MESSAGE`.
- Apply `pruneConversationHistory(messages, 6)` before constructing the Gemini `contents` payload.
- Wrap Gemini API fetch with 15-second `AbortController`:
  - `const controller = new AbortController();`
  - `const timeoutId = setTimeout(() => controller.abort(), 15000);`
- Catch upstream 429 (`RESOURCE_EXHAUSTED`), 500/502/503 outages, and timeouts, returning the appropriate status code and zero-emoji error message.

### 1.3 Client Hook & Component Upgrades
- `components/assistant/use-assistant-chat.ts`:
  - Maintain `lastFailedMessage: string | null` when fetch fails or returns HTTP >= 400.
  - Implement `retryLastMessage()` callback.
  - Parse API error responses (e.g., 429, 503, 504) and set the error message as an assistant message or error state.
- `components/assistant/assistant-input-bar.tsx`:
  - Verify that `<input>` and `<button>` are disabled when `status === 'loading'`.
  - Prevent Enter key or form submit when `status === 'loading'` or input is empty/whitespace.
- `components/assistant/assistant-message-list.tsx`:
  - Display `"Checking store records..."` with pulsing dot during `status === 'loading'`.
  - When an error occurs or a message has `status: 'error'`, render the error notice with semantic danger classes (`bg-danger-light border-danger-border text-danger`) and a "Retry" button.

---

## 2. Test Plan (TDD Red-Green-Refactor)

- `tests/assistant-resilience.test.ts`:
  - Test `pruneConversationHistory`: empty list, list with <= 6 items, list with 10+ items.
  - Test error mapping function: 429 status, `RESOURCE_EXHAUSTED` string, timeout AbortError, 503 upstream, missing API key.
  - Test `/api/chat` missing API key -> HTTP 503 with exact text.
  - Test `/api/chat` rate limit 429 -> HTTP 429 with exact text.
  - Test `/api/chat` timeout (>15s) -> HTTP 504 with exact text.
  - Test zero-emoji invariant across all error constants.
