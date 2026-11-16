# Implementation Tasks: Gemini Free-Tier Resilience, Context Pruning & Rate Limit Handling

**Feature Key**: `ARL-34`  
**Feature Slug**: `020-gemini-free-tier-resilience`  
**Status**: In Progress  

---

## Task List

- [ ] **Task 1: Define Resilience Module, Context Pruning & Standardized Error Constants**
  - **File**: `lib/assistant/assistant-resilience.ts`
  - Implement and export `pruneConversationHistory<T>(messages: T[], maxTurns = 6): T[]`.
  - Export standardized error message constants (`MISSING_API_KEY_MESSAGE`, `RATE_LIMIT_MESSAGE`, `TIMEOUT_MESSAGE`, `UPSTREAM_OUTAGE_MESSAGE`, `GENERIC_ERROR_MESSAGE`).
  - Implement `mapGeminiError(errorOrStatus: unknown, responseBody?: string): { status: number; message: string }`.
  - Ensure strict zero-emoji compliance.

- [ ] **Task 2: Build Automated Unit Test Suite (TDD Red Phase)**
  - **File**: `tests/assistant-resilience.test.ts`
  - Unit test `pruneConversationHistory` with 0, 3, 6, and 12 message turns.
  - Unit test error mapping for missing API key, rate limits, timeouts, and outages.
  - Integration test `POST /api/chat` with missing `GEMINI_API_KEY` returning HTTP 503.
  - Integration test `POST /api/chat` rate limit 429 and timeout 504 mapping.
  - Assert zero emojis across all responses and constants.

- [ ] **Task 3: Integrate Context Pruning & Resilience into Chat API Route**
  - **File**: `app/api/chat/route.ts`
  - Export `pruneConversationHistory` directly from `app/api/chat/route.ts` as specified by DoD.
  - Add missing `GEMINI_API_KEY` check returning HTTP 503 with standardized message.
  - Apply `pruneConversationHistory` to request messages before formatting Gemini contents.
  - Add 15-second `AbortController` timeout for upstream fetch calls.
  - Add structured HTTP 429, 503, 504, and 500 error handlers.

- [ ] **Task 4: Upgrade Client Hook & UI for Debouncing, Status Indicator & Inline Error Recovery**
  - **Files**:
    - `components/assistant/use-assistant-chat.ts`
    - `components/assistant/assistant-input-bar.tsx`
    - `components/assistant/assistant-message-list.tsx`
  - Add `lastFailedQuery` and retry capability to `use-assistant-chat.ts`.
  - Render `"Checking store records..."` with pulsing dot during `loading`.
  - Render inline error notice with semantic danger tokens and a working "Retry" button.
  - Ensure input locking and debounce prevents multiple submissions.

- [ ] **Task 5: End-to-End Verification, Typecheck, Spec Sync & PR Preparation**
  - Run `node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/assistant-*.test.ts"`.
  - Run full test suite: `node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/*.test.ts"`.
  - Run `npx tsc --noEmit`.
  - Follow `.agents/rules/atomic-commit.md` for clean architectural commits.
