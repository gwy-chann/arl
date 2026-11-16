# Implementation Tasks: Strict Out-of-Scope Interception & Persona System Prompt

**Feature Key**: `ARL-33`  
**Feature Slug**: `019-out-of-scope-refusal-guardrails`  
**Status**: Completed  

---

## Task List

- [x] **Task 1: Define Guardrails Module, Persona Prompt & Refusal Templates**
  - **File**: `lib/assistant/assistant-guardrails.ts`
  - Implement `ARLQ_SYSTEM_INSTRUCTION` matching the 5 core operational mandates.
  - Export `OUT_OF_SCOPE_REFUSAL_MESSAGE`, `MUTATION_REFUSAL_MESSAGE`, and `JAILBREAK_REFUSAL_MESSAGE`.
  - Implement `classifyQueryIntent(message: string): QueryIntent`.
  - Implement `getRefusalResponseForIntent(intent: QueryIntent): string | null`.
  - Implement `stripEmojis(text: string): string`.

- [x] **Task 2: Build Automated Test Suite for Guardrails & Refusals (TDD Red Phase)**
  - **File**: `tests/assistant-guardrails.test.ts`
  - Test `ARLQ_SYSTEM_INSTRUCTION` content, structure, and required clauses.
  - Test `classifyQueryIntent` across 15+ varied queries (general trivia, recipes with condiment words, mutations, adversarial/jailbreaks, in-scope operational prompts).
  - Test `POST /api/chat` refusal handling for general trivia / culinary queries (Scenario 1).
  - Test `POST /api/chat` refusal handling for mutation / alteration queries (Scenario 2).
  - Test `POST /api/chat` refusal handling for adversarial jailbreak attempts (Scenario 3).
  - Test strict zero-emoji compliance across all responses (Scenario 4).

- [x] **Task 3: Integrate Guardrails into Chat API Route & Offline Generator**
  - **File**: `app/api/chat/route.ts`
  - Export `ARLQ_SYSTEM_INSTRUCTION`.
  - Implement pre-flight guardrail interception before Gemini API or tool execution.
  - Ensure zero tools are executed on refusals (`toolCallsExecuted: []`).
  - Wire `ARLQ_SYSTEM_INSTRUCTION` as top-level Gemini systemInstruction.
  - Add post-processing response sanitizer using `stripEmojis()`.

- [x] **Task 4: End-to-End Verification, Typecheck & Atomic Commits**
  - Run `node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/*.test.ts"`.
  - Run `npx tsc --noEmit` to verify type safety.
  - Verify zero regressions across entire test suite.
  - Follow `.agents/rules/atomic-commit.md` for clean commit history.
