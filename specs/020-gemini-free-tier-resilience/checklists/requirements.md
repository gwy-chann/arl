# Requirements Quality Checklist: Gemini Free-Tier Resilience & Rate Limit Handling

**Feature Key**: `ARL-34`  
**Feature Slug**: `020-gemini-free-tier-resilience`  

---

## 1. Requirement Completeness & Ambiguity Checks ("Unit Tests for English")

- [x] **Sliding Window Boundary**: Does the specification define the exact number of turns retained?
  - *Verification*: Exactly the last 6 message turns (3 user turns, 3 assistant replies) are retained.
- [x] **System Instruction Invariance**: Does pruning drop or preserve the system instruction?
  - *Verification*: Older conversation turns are dropped, but `ARLQ_SYSTEM_INSTRUCTION` remains permanently prepended as the top-level API system instruction.
- [x] **Upstream Status Code Mapping**: Are all error cases mapped to explicit HTTP status codes?
  - *Verification*: Missing API Key -> 503, Quota/Rate Limit (429/RESOURCE_EXHAUSTED) -> 429, Timeout (>15s) -> 504, Upstream 500/502/503 -> 503, Unhandled exceptions -> 500.
- [x] **Standardized Error Copy**: Is the user-facing text for all error cases verbatim specified without emojis?
  - *Verification*: All 5 client-facing error strings are defined verbatim with strict zero-emoji verification.
- [x] **Input Locking & Debouncing**: Are input elements disabled during in-flight requests?
  - *Verification*: Both `<input>` and `<button type="submit">` are disabled when `status === 'loading'`. Enter key submission is suppressed while loading.
- [x] **Inline Recovery Flow**: Can the user recover from an error without refreshing?
  - *Verification*: Error notice provides a "Retry" button that re-submits the last failed user query.

---

## 2. Design System & Theme Alignment

- [x] **Zero Hardcoded Colors**:
  - *Surfaces*: `bg-bg-surface`, `bg-bg-base`, `bg-danger-light`.
  - *Text*: `text-text-primary`, `text-text-muted`, `text-danger`, `text-text-light`.
  - *Borders*: `border-border`, `border-danger-border`.
  - *Actions*: `bg-primary`, `hover:bg-primary-hover`.
- [x] **Dark Mode Native Support**: Semantic tokens inherit dark mode variables automatically without brittle `dark:` manual overrides.

---

## 3. Test Coverage & Verification

- [x] Context pruning helper unit tests covering <=6 turns, >6 turns, and empty history.
- [x] Upstream status code interception and mapping tests for 429, 503, 504, and 500.
- [x] Missing `GEMINI_API_KEY` returning 503 with friendly setup notice.
- [x] Client component input bar test for loading state disabling and submit suppression.
- [x] Zero-emoji assertion across all resilience notices and error messages.
