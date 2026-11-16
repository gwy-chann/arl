# Resilience Contracts & Error Messages: Gemini Free-Tier Assistant

**Feature Key**: `ARL-34`  
**Feature Slug**: `020-gemini-free-tier-resilience`  

---

## 1. Verbatim Error Messages (Strict Zero-Emoji Invariant)

```typescript
export const ERROR_MESSAGES = {
  MISSING_API_KEY:
    'The store assistant is not configured. Please configure GEMINI_API_KEY in the environment settings.',
  RATE_LIMIT:
    'The store assistant is receiving high request traffic. Please wait 30 seconds before sending another question.',
  TIMEOUT:
    'The request timed out while checking store records. Please try again.',
  UPSTREAM_OUTAGE:
    'The store assistant service is temporarily unavailable. Please try again shortly.',
  GENERIC_ERROR:
    'An unexpected error occurred while processing your request. Please try again.',
} as const;
```

---

## 2. Context Pruning Contract

```typescript
/**
 * Trims message history to the most recent `maxTurns` items.
 * Guaranteed to preserve chronological order of the remaining items.
 */
export function pruneConversationHistory<T extends { role: string; content: string }>(
  messages: T[],
  maxTurns = 6
): T[];
```

---

## 3. Error Mapper Contract

```typescript
export interface MappedAssistantError {
  status: number;
  message: string;
}

/**
 * Maps raw exceptions, abort errors, and HTTP status codes to standardized user messages.
 */
export function mapGeminiError(
  statusOrError: number | Error | unknown,
  responseBody?: string
): MappedAssistantError;
```
