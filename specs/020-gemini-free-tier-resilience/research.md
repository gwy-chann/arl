# Architectural Research: Gemini Free-Tier Resilience, Context Pruning & Rate Limit Handling

**Feature Key**: `ARL-34`  
**Feature Slug**: `020-gemini-free-tier-resilience`  

---

## 1. Technical Context & Upstream Constraints

### 1.1 Google AI Studio Gemini 2.0 Flash Free Tier Limits
The application consumes the `gemini-2.0-flash` model endpoint under Google AI Studio's Free Tier:
- **Rate Limits**: 15 Requests Per Minute (RPM)
- **Token Limits**: 1,000,000 Tokens Per Minute (TPM)
- **Daily Quota**: 1,500 Requests Per Day (RPD)

### 1.2 Upstream Failure Modes
When the quota is exceeded or services experience degradation, Google Generative Language API emits:
- `HTTP 429 Too Many Requests`: JSON payload with `status: "RESOURCE_EXHAUSTED"` or `details: [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", "reason": "RATE_LIMIT_EXCEEDED" }]`.
- `HTTP 503 Service Unavailable`: Temporary upstream cluster congestion (`status: "UNAVAILABLE"`).
- `HTTP 500 / 502`: Gateway error or internal inference exception.

---

## 2. Context Pruning Mechanics (Sliding Window)

### 2.1 The Need for Windowing
In a conversational session, passing the entire array of user questions and model replies accumulates tokens monotonically. In multi-turn functional calling, intermediate tool calls and function outputs further compound token load.

### 2.2 Turn Slicing Strategy
- Retaining **6 turns** equates to 3 complete request-response pairs.
- In-flight testing confirms 6 turns typically consume fewer than 1,500 tokens of conversational context.
- System instructions (`ARLQ_SYSTEM_INSTRUCTION`) are not counted in the 6 message turns; they are maintained in the top-level API parameter `systemInstruction.parts[0].text`.
- Formula:
  ```typescript
  export function pruneConversationHistory<T>(messages: T[], maxTurns = 6): T[] {
    return messages.length <= maxTurns ? messages : messages.slice(-maxTurns);
  }
  ```

---

## 3. Network Resilience & AbortSignals

### 3.1 15-Second Gateway Timeout
Standard user attention degrades after 3-5 seconds; 15 seconds provides ample allowance for multi-turn tool execution across Supabase while terminating frozen network sockets cleanly.

Implementation via standard Web APIs:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);
try {
  const res = await fetch(geminiUrl, {
    signal: controller.signal,
    // ...
  });
} finally {
  clearTimeout(timeoutId);
}
```

### 3.2 Error Detection Pattern
Errors may arise as:
1. `DOMException: The user aborted a request` or `error.name === 'AbortError'` (Timeout -> HTTP 504).
2. Fetch response `res.status === 429` or error body containing `RESOURCE_EXHAUSTED` (Rate limit -> HTTP 429).
3. Missing API key `!process.env.GEMINI_API_KEY` (Not configured -> HTTP 503).
4. Fetch response `res.status >= 500 && res.status <= 503` (Upstream outage -> HTTP 503).

---

## 4. UI / UX Resilience & Accessible Recovery

### 4.1 Loading & Debounce States
- In `assistant-input-bar.tsx`:
  - `disabled={status === 'loading'}` on both `<input>` and `<button type="submit">`.
  - Enter key press is suppressed when `status === 'loading'`.
  - Empty string submissions are prevented via `value.trim().length > 0`.
- In `assistant-message-list.tsx`:
  - Visual status line: `"Checking store records..."` with semantic pulsing animation.

### 4.2 Inline Error Notice with Retry
- When a response fails (network error or HTTP status >= 400), an error bubble is appended to the message list:
  ```tsx
  <div className="bg-danger-light border border-danger-border text-danger text-xs rounded-md p-2.5 flex items-center justify-between gap-2">
    <span>{errorMessage}</span>
    <button
      onClick={() => onRetry(lastUserMessage)}
      className="text-xs font-medium text-danger hover:underline cursor-pointer"
    >
      Retry
    </button>
  </div>
  ```
- This empowers users to immediately recover from temporary 429 spikes or network glitches without reloading the page or losing input context.
