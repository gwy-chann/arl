# Research & Architectural Analysis: Strict Out-of-Scope Interception & Persona System Prompt

**Feature Key**: `ARL-33`  
**Feature Slug**: `019-out-of-scope-refusal-guardrails`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  
**Date**: November 2026  

---

## 1. Technical Context & Constraints

- **Framework**: Next.js 15 App Router with Node.js runtime for API routes (`app/api/chat/route.ts`).
- **Free-Tier API Constraints**: Google AI Studio Gemini 2.0 Flash Free Tier enforces a strict rate limit of 15 Requests Per Minute (RPM) and 1,500 Requests Per Day (RPD). Every out-of-scope query or repetitive tool execution unnecessarily consumes this quota.
- **Zero-Emoji Policy**: System-wide architectural rule forbids emojis anywhere in user-facing responses or code.
- **Read-Only Invariant**: The assistant must never execute write operations against Supabase or state. Any user attempting mutations must be directed to UI modules.
- **Testing Harness**: Native Node.js test runner (`node:test`, `node:assert/strict`).

---

## 2. Guardrails Architecture & Dual-Layer Defense

To ensure 100% reliable enforcement across both offline local mock mode and live Gemini API mode, we adopt a **Dual-Layer Guardrail Architecture**:

```
User Query
    │
    ▼
[ Layer 1: Pre-Flight Intent Classifier ] (Deterministic Regex / Keyword Matching)
    │
    ├─► Adversarial / Jailbreak? ───────► Return JAILBREAK_REFUSAL_MESSAGE (0 tools)
    ├─► Mutation / Data Alteration? ───► Return MUTATION_REFUSAL_MESSAGE (0 tools)
    ├─► Out-of-Scope / Cooking / Trivia? ► Return OUT_OF_SCOPE_REFUSAL_MESSAGE (0 tools)
    │
    ▼ (In-Scope Query)
[ Layer 2: LLM System Prompt & Tool Execution ]
    │
    ├─► Gemini 2.0 Flash guided by ARLQ_SYSTEM_INSTRUCTION
    ├─► Multi-turn Tool Calling Loop (Read-Only Tools Only)
    │
    ▼
[ Layer 3: Post-Generation Response Sanitizer ]
    │
    └─► stripEmojis(content) & containsEmoji check
```

### 2.1 Layer 1: Deterministic Pre-Flight Guardrail (`classifyQueryIntent`)
- Evaluates queries for immediate refusal triggers:
  1. **Adversarial / Jailbreak**: Tokens such as `system override`, `ignore previous instructions`, `ignore all instructions`, `print your instructions`, `reveal your prompt`, `you are now dan`, `unrestricted ai`, `jailbreak`.
  2. **Mutation**: Verbs attempting data alterations like `update stock`, `set price`, `delete receipt`, `delete sale`, `record new sale`, `create customer`, `modify product`, `change price`, `add stock`.
  3. **Out-of-Scope**: Topics like `capital of`, `president of`, `recipe`, `chicken adobo`, `pork adobo`, `sinigang`, `weather in`, `who is`, `who was`, `write code`, `python script`, `solve math`, `translate to`.
- Benefits:
  - Zero token consumption on Google AI Studio for obvious junk queries.
  - Sub-millisecond refusal response times.
  - Zero tool calls executed (`toolCallsExecuted: []`).
  - Works reliably in both online and offline development environments.

### 2.2 Layer 2: LLM Persona System Instruction (`ARLQ_SYSTEM_INSTRUCTION`)
- For ambiguous or nuanced queries that pass pre-flight, `ARLQ_SYSTEM_INSTRUCTION` strictly binds Gemini:
  - Embeds store domain context (Toyo, Suka, Patis in 350 ml, 1 L, 1 gal).
  - Outlines in-scope domain entities (stock levels, prices, sales summaries, utang debt, settings).
  - Explicitly commands exact refusal messages for general knowledge, recipes, and mutations.
  - Commands absolute zero-emoji policy and strict Philippine Peso formatting (`₱`).

### 2.3 Layer 3: Output Sanitization & Emoji Strip
- Ensures that even if an upstream model emits a Unicode emoji or pictorial symbol, the response is sanitized using `stripEmojis(text)` before dispatching JSON to the client.
- Passes `containsEmoji(content) === false` validation invariant.

---

## 3. Standardized Response Copy Matrix

| Classification | Constant Name | Exact Output Copy |
| :--- | :--- | :--- |
| **Out-of-Scope / General Knowledge / Recipes** | `OUT_OF_SCOPE_REFUSAL_MESSAGE` | `"I can only assist with ARLQ store data, including inventory stock, sales summaries, and customer balances. Please ask an operational question related to the store."` |
| **Mutation / Modification Requests** | `MUTATION_REFUSAL_MESSAGE` | `"I am a read-only assistant and cannot modify records or process transactions. Please use the appropriate module in the navigation menu to make changes."` |
| **Adversarial / Jailbreak / Instruction Leak** | `JAILBREAK_REFUSAL_MESSAGE` | `"I can only assist with verified ARLQ store operational data."` |

---

## 4. Performance & Rate-Limit Impact Analysis

- Average token consumption of out-of-scope query before guardrail: ~300 prompt tokens + 150 generation tokens + potential unneeded DB queries.
- With pre-flight guardrail: **0 API tokens consumed**, 0 DB queries, response latency < 2ms.
- Preserves free-tier 15 RPM / 1,500 RPD budget for legitimate operational store inquiries.
