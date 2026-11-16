# Data Model & Domain Entities: Out-of-Scope Guardrails & Persona

**Feature Key**: `ARL-33`  
**Feature Slug**: `019-out-of-scope-refusal-guardrails`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Domain Entities & Schemas

### 1.1 Query Intent Classification

```typescript
export type QueryIntent =
  | 'in_scope'
  | 'out_of_scope'
  | 'mutation'
  | 'adversarial';
```

- **`in_scope`**: Queries about store inventory, sales, customer utang, pricing, or settings. Dispatched to database grounding tools or LLM tool-calling loop.
- **`out_of_scope`**: Trivia, weather, recipes (even using condiments), general knowledge, non-ARLQ coding/math. Refused with `OUT_OF_SCOPE_REFUSAL_MESSAGE`.
- **`mutation`**: Requests to create, update, delete, or modify records (e.g. "update stock", "set price", "delete sale"). Refused with `MUTATION_REFUSAL_MESSAGE`.
- **`adversarial`**: Attempts to jailbreak, override system prompts, extract raw instructions, or impersonate unrestricted personas (DAN). Refused with `JAILBREAK_REFUSAL_MESSAGE`.

---

## 2. Refusal Response DTOs

Refusal responses follow the standard assistant response payload contract:

```typescript
export interface ChatResponsePayload {
  role: 'assistant';
  content: string;
  toolCallsExecuted: string[];
}
```

### Invariant for Refusals:
- `toolCallsExecuted` must be `[]` (empty array) for all refused queries.
- `content` must match the exact refusal template.
- `content` must pass `containsEmoji(content) === false`.

---

## 3. State Transitions

```
[ Incoming User Message ]
           │
           ▼
[ Intent Classification ] 
      │           │            │               │
  adversarial  mutation   out_of_scope      in_scope
      │           │            │               │
      ▼           ▼            ▼               ▼
 [Jailbreak]  [Mutation]  [OutOfScope]    [Grounding Engine /
  Refusal      Refusal      Refusal        Gemini Tool Loop]
      │           │            │               │
      └───────────┴────────────┴───────────────┘
                      │
                      ▼
             [Emoji Sanitizer]
                      │
                      ▼
           [ Client JSON Response ]
```
