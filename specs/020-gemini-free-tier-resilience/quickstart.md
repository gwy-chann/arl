# Verification & Quickstart Guide: Gemini Free-Tier Resilience

**Feature Key**: `ARL-34`  
**Feature Slug**: `020-gemini-free-tier-resilience`  

---

## 1. Quick Verification Commands

Inside `.worktrees/ARL-34`:

```bash
# 1. Run automated unit tests for resilience and context pruning
node --no-warnings=ExperimentalWarning --test --experimental-strip-types tests/assistant-resilience.test.ts

# 2. Run all assistant tests to ensure zero regressions
node --no-warnings=ExperimentalWarning --test --experimental-strip-types tests/assistant-*.test.ts

# 3. Type check the entire codebase
npx tsc --noEmit
```

---

## 2. Interactive Scenarios Walkthrough

### Scenario 1: Sliding Window Context Pruning
1. Submit 10 consecutive questions in the chat widget.
2. Inspect the network payload for `/api/chat`.
3. Verify that the outgoing `contents` array sent to Gemini contains only the 6 most recent message turns.
4. Verify that `systemInstruction` remains intact.

### Scenario 2: Prevention of Duplicate Submissions
1. Type a question and click "Send".
2. While `status === 'loading'`, attempt to click the "Send" button again or press Enter in the input bar.
3. Verify that input is locked (`disabled`) and no duplicate requests are triggered.
4. Verify the animated indicator `"Checking store records..."` displays.

### Scenario 3: HTTP 429 Quota Exhaustion
1. Simulate a 429 response from Google AI Studio.
2. Verify the chat widget renders:
   `"The store assistant is receiving high request traffic. Please wait 30 seconds before sending another question."`
3. Verify zero emojis and the presence of a "Retry" button.

### Scenario 4: Missing GEMINI_API_KEY
1. In an environment without `GEMINI_API_KEY`, send a question.
2. Verify `/api/chat` returns HTTP 503.
3. Verify the chat displays:
   `"The store assistant is not configured. Please configure GEMINI_API_KEY in the environment settings."`

### Scenario 5: Timeout Recovery
1. Simulate a network delay exceeding 15 seconds.
2. Verify the request cancels via AbortController and returns HTTP 504.
3. Verify the message list presents `"The request timed out while checking store records. Please try again."` with a "Retry" button.
