# Assistant Guardrails Contracts & Interfaces

**Feature Key**: `ARL-33`  
**Feature Slug**: `019-out-of-scope-refusal-guardrails`  

---

## 1. Constants & Prompt Specification

```typescript
export const ARLQ_SYSTEM_INSTRUCTION: string;

export const OUT_OF_SCOPE_REFUSAL_MESSAGE: string =
  'I can only assist with ARLQ store data, including inventory stock, sales summaries, and customer balances. Please ask an operational question related to the store.';

export const MUTATION_REFUSAL_MESSAGE: string =
  'I am a read-only assistant and cannot modify records or process transactions. Please use the appropriate module in the navigation menu to make changes.';

export const JAILBREAK_REFUSAL_MESSAGE: string =
  'I can only assist with verified ARLQ store operational data.';
```

---

## 2. Guardrail Functions

```typescript
export type QueryIntent = 'in_scope' | 'out_of_scope' | 'mutation' | 'adversarial';

/**
 * Classifies the intent of a user message to detect out-of-scope, mutation, or adversarial queries.
 */
export function classifyQueryIntent(message: string): QueryIntent;

/**
 * Returns the standardized refusal response for a given non-in-scope intent, or null if in-scope.
 */
export function getRefusalResponseForIntent(intent: QueryIntent): string | null;

/**
 * Sanitizes any text string to strip emojis, ensuring zero-emoji invariant is never violated.
 */
export function stripEmojis(text: string): string;
```
