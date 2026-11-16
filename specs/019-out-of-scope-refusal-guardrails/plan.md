# Implementation Plan: Strict Out-of-Scope Interception & Persona System Prompt

**Feature Key**: `ARL-33`  
**Feature Slug**: `019-out-of-scope-refusal-guardrails`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Technical Architecture & File Inventory

### 1.1 Guardrails & Persona Module (`lib/assistant/assistant-guardrails.ts`)
- Export `ARLQ_SYSTEM_INSTRUCTION` embedding the 5 mandatory operational mandates:
  1. Strict in-scope topics (inventory, sales summaries, customer utang, store settings).
  2. Strict out-of-scope refusal (general knowledge, cooking recipes, weather, coding).
  3. Read-only guarantee (refuse all mutations, direct to UI navigation).
  4. Zero-emoji policy & formatting (Philippine Peso sign `₱`, sizes `350 ml`, `1 L`, `1 gal`).
  5. Jailbreak & injection resistance.
- Export exact standardized refusal messages:
  - `OUT_OF_SCOPE_REFUSAL_MESSAGE`
  - `MUTATION_REFUSAL_MESSAGE`
  - `JAILBREAK_REFUSAL_MESSAGE`
- Implement `classifyQueryIntent(message: string): QueryIntent`
- Implement `getRefusalResponseForIntent(intent: QueryIntent): string | null`
- Implement `stripEmojis(text: string): string`

### 1.2 Chat API Route Integration (`app/api/chat/route.ts`)
- Re-export `ARLQ_SYSTEM_INSTRUCTION` for external consumers/tests.
- Wire pre-flight guardrail check:
  - If latest user message is classified as `out_of_scope`, `mutation`, or `adversarial`, immediately return the exact refusal message with `toolCallsExecuted: []` without calling external Gemini API or Supabase database tools.
- Update `generateOfflineGroundedResponse` to honor guardrails and refusal copies.
- Pass `ARLQ_SYSTEM_INSTRUCTION` into Gemini `systemInstruction` in live mode.
- Apply `stripEmojis()` on all output text before generating JSON response.

### 1.3 Automated Test Suite (`tests/assistant-guardrails.test.ts`)
- 10+ adversarial, out-of-scope, recipe, and mutation test cases.
- In-scope query verification confirming normal grounding is unaffected.
- Zero-emoji assertion tests covering refusal strings and responses.
- Persona clause presence tests.

---

## 2. Test-Driven Development (TDD) Strategy

1. **Step 1: Test Suite Creation (Red)**
   - Author `tests/assistant-guardrails.test.ts` with comprehensive test cases.
2. **Step 2: Guardrails Implementation (Green)**
   - Create `lib/assistant/assistant-guardrails.ts`.
3. **Step 3: Route Integration (Green)**
   - Update `app/api/chat/route.ts` with guardrails pre-flight and `ARLQ_SYSTEM_INSTRUCTION`.
4. **Step 4: Verification & Regression Gate**
   - Run `npm test` to verify all 22 test suites pass with 0 failures.
   - Run `npx tsc --noEmit` for TypeScript safety.
