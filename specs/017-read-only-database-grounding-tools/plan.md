# Implementation Plan: Read-Only Database Grounding Tools

**Feature Key**: `ARL-32`  
**Feature Slug**: `017-read-only-database-grounding-tools`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Technical Architecture & File Inventory

### 1.1 Contracts & Schemas
- `specs/017-read-only-database-grounding-tools/contracts/assistant-grounding-contracts.ts`:
  - Canonical specification contracts.
- `lib/assistant/assistant-grounding-contracts.ts`:
  - Implementation contracts: Zod validation schemas for inputs and outputs of `getInventorySummary`, `getSalesOverview`, `getCustomerBalances`, and `getStoreSettings`.
  - Formatters: `formatPhilippinePeso`, `formatPackagingSize`.
  - Gemini function declarations: `ASSISTANT_TOOL_DECLARATIONS`.

### 1.2 Tool Services & Dispatcher (`lib/assistant/`)
- `lib/assistant/assistant-tools.ts`:
  - `getInventorySummary(params, supabase?)`: Joins `products` + `product_variants` or queries `ProductService`. Flags low stock, filters by condiment or low stock only.
  - `getSalesOverview(params, supabase?)`: Aggregates transactions, revenue, cash collected, and balance according to Manila timezone boundaries.
  - `getCustomerBalances(params, supabase?)`: Audits indebted customers, computes unpaid days and overdue status against threshold (default 7 days).
  - `getStoreSettings(params, supabase?)`: Fetches store name, reminder days, and notification configs.
  - `executeToolCall(toolName, args, supabase?)`: Typed dispatcher validating parameters and executing the requested read-only tool.

### 1.3 Chat API Route Integration (`app/api/chat/`)
- `app/api/chat/route.ts`:
  - POST handler accepting conversation messages.
  - Invokes Gemini 2.0 Flash with tools declared in `ASSISTANT_TOOL_DECLARATIONS`.
  - Handles tool call execution loop, invoking `executeToolCall` and returning the final grounded response.
  - Provides graceful offline/mock fallback when `GEMINI_API_KEY` is not present, answering using the grounded tools directly.

### 1.4 Automated Test Suite
- `tests/assistant-grounding-tools.test.ts`:
  - Unit tests covering all 4 tool query functions.
  - Test cases for parameter filtering (condiment search, low-stock only, timeframes, overdue only).
  - Currency formatting (`₱1,250.00`) and packaging size standardization (`350 ml`, `1 L`, `1 gal`).
  - Read-only security assertions: zero write mutations permitted.
  - Missing entity handling (e.g. "Mang Tomas" returns empty list, unknown customers return empty list).
  - Tool execution dispatcher validation.

---

## 2. Test-Driven Development (TDD) Strategy

1. **Step 1: Contracts & Validation Tests (Red)**:
   - Create `tests/assistant-grounding-tools.test.ts` testing input/output schema validation, formatting helpers, and expected tool behavior.
2. **Step 2: Contracts Implementation (Green)**:
   - Implement `lib/assistant/assistant-grounding-contracts.ts`.
3. **Step 3: Query Services Implementation (Green)**:
   - Implement `lib/assistant/assistant-tools.ts` with Supabase integration and robust in-memory fallbacks.
4. **Step 4: Chat API Route & Tool Dispatcher (Green)**:
   - Implement `app/api/chat/route.ts` with tool loop and error boundaries.
5. **Step 5: Full Suite Verification & Refactor**:
   - Run `npm test` and `npm run lint` to guarantee all tests pass with zero regressions.
