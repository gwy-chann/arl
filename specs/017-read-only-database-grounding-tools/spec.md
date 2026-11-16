# Feature Specification: Read-Only Database Grounding Tools (Inventory, Sales, Customer Balances)

**Feature Key**: `ARL-32`  
**Feature Slug**: `017-read-only-database-grounding-tools`  
**Jira Story**: STORY-6.3: Read-Only Database Grounding Tools (Inventory, Sales, Customer Balances)  
**Parent Epic**: EPIC-6: In-App AI Operational Assistant (Gemini Flash Free Tier) (`ARL-29`)  
**Status**: Ready for Planning & Implementation  

---

## 1. User Story

* **As an** ARLQ store administrator,
* **I want** the assistant to answer operational questions using live data from the store database via structured, read-only function tools,
* **so that** I receive 100% accurate, unhallucinated figures on stock quantities, revenue metrics, and outstanding customer debt without risking database mutations.

---

## 2. Business Value & Technical Rationale

In condiment wholesale and retail management (Toyo, Suka, and Patis in 350ml, 1L, and 1gal packaging), relying solely on large language model (LLM) parametric memory leads to severe numerical hallucinations. Real-time grounding via server-side function calling guarantees:

1. **Mathematical & Inventory Accuracy**: Stock numbers, threshold violations, sales aggregates, and customer credit balances are queried directly from live PostgreSQL database records (with in-memory fallback support for testing and offline environments).
2. **Deterministic Data Contracts**: Typed tool signatures allow Gemini 2.0 Flash to emit structured JSON function calls and receive strongly typed JSON payloads.
3. **Absolute Read-Only Security Boundary**: Under no circumstances does the assistant define, register, expose, or execute write operations (`INSERT`, `UPDATE`, `DELETE`, `ALTER`, `TRUNCATE`). All mutating store actions must be completed through explicit administrative UI forms.
4. **Philippine Localization Standards**:
   - Currency: Display formatted in Philippine Peso (`₱1,250.00`).
   - Packaging sizes: Display formatted cleanly as `350 ml`, `1 L`, `1 gal`.
   - Timezone: Sales aggregations respect `Asia/Manila` (UTC+8) calendar boundaries.

---

## 3. Business Invariants & Security Rules

1. **Zero-Write Mutation Guarantee**:
   - The assistant only has access to read-only queries (`SELECT`).
   - If an LLM or prompt attempts to request a state change (e.g. "Create a sale", "Deduct 5 bottles", "Add customer"), no tool exists to execute the request, and the assistant must state that mutations must be performed via store forms.

2. **Tool Scope & Grounding Responsibilities**:
   - `getInventorySummary`: Inspects condiment stock (`Toyo`, `Suka`, `Patis`), packaging sizes (`350 ml`, `1 L`, `1 gal`), selling/cost prices, and flags variants where `stockQuantity <= minStockLevel`.
   - `getSalesOverview`: Computes order counts, gross revenue, cash collected, and outstanding balances across time windows (`today`, `yesterday`, `last_7_days`, `current_month`, `all`) localized to Manila time.
   - `getCustomerBalances`: Audits customer credit (*utang*), identifies indebted accounts, tracks the oldest unpaid invoice age, and flags overdue balances exceeding the store threshold (default 7 days).
   - `getStoreSettings`: Fetches operating configuration, default reminder days, and notification contacts.

3. **Graceful Handling of Missing Entities**:
   - Queries for non-existent products (e.g., "Mang Tomas", "Ketchup") return empty result lists, and the assistant informs the user that ARLQ only carries Toyo, Suka, and Patis.
   - Queries for unknown customers return empty match arrays rather than fabricated credit profiles.

4. **Zero-Emoji Compliance**:
   - System messages, error payloads, and tool result summaries must contain zero emojis in accordance with the ARLQ brand invariant.

---

## 3.1 Clarifications & Resolution Log

- **Clarification 1 (Offline/Mock Mode)**: When Supabase environment variables are missing or unconfigured, tools gracefully delegate to in-memory domain service stores (`ProductService`, `SaleService`, `CustomerService`, `getSystemSettings`) so local tests and offline dev remain 100% operational.
- **Clarification 2 (Date Boundaries)**: Timeframe aggregations for `today` and `yesterday` use the Philippines standard time (`Asia/Manila`, UTC+8) to prevent UTC date-rollover errors during Philippine business hours.
- **Clarification 3 (Overdue Policy)**: The overdue threshold default is 7 days, dynamically superseded if custom `overdue_reminder_days` is configured in `store_settings`.

---

## 4. Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Grounded Low-Stock Inquiry
- **Given** the database contains `Toyo 1 L` with stock 8 (minimum level: 10) and `Suka 350 ml` with stock 2 (minimum level: 5)
- **When** the administrator asks "Which items are currently low on stock?"
- **Then** the assistant triggers `getInventorySummary({ lowStockOnly: true })`
- **And** responds citing `Toyo 1 L` (8 remaining, below min 10) and `Suka 350 ml` (2 remaining, below min 5)
- **And** formats values with exact unit labels (`1 L`, `350 ml`) without fabricating extra items.

### Scenario 2: Variant-Specific Pricing and Count Lookup
- **Given** an inventory record for `Patis 1 gal` with selling price ₱380.00 and stock 15
- **When** the administrator asks "How much is 1 gallon Patis and how many do we have?"
- **Then** the assistant triggers `getInventorySummary({ searchQuery: 'Patis' })`
- **And** responds that Patis 1 gal is priced at `₱380.00` with `15` units in stock.

### Scenario 3: Daily Sales Revenue Aggregation
- **Given** sales recorded today totaling ₱4,500.00 gross (₱3,000.00 collected cash, ₱1,500.00 balance) across 6 transactions
- **When** the administrator asks "Summarize today's sales"
- **Then** the assistant invokes `getSalesOverview({ timeframe: 'today' })`
- **And** reports 6 transactions, `₱4,500.00` total sales, `₱3,000.00` collected, and `₱1,500.00` outstanding debt.

### Scenario 4: Overdue Utang Ledger Lookup
- **Given** customer "Juan Dela Cruz" has an unpaid balance of ₱1,200.00 outstanding for 10 days (overdue >= 7 days)
- **When** the administrator asks "Who has overdue utang?"
- **Then** the assistant invokes `getCustomerBalances({ overdueOnly: true })`
- **And** displays Juan Dela Cruz with `₱1,200.00` overdue for 10 days.

### Scenario 5: Non-Existent Entity Handling
- **Given** a product or customer name that does not exist in the store database (e.g. "Mang Tomas")
- **When** the administrator asks "Check stock for Mang Tomas"
- **Then** the assistant executes `getInventorySummary({ searchQuery: 'Mang Tomas' })`
- **And** returns an empty item list
- **And** the assistant clearly states that no product named "Mang Tomas" is carried in the store catalog (ARLQ stocks Toyo, Suka, and Patis only).

---

## 5. Definition of Done (DoD)

- [ ] Database query services implemented in `lib/assistant/assistant-tools.ts` for all 4 tools.
- [ ] Typed Gemini tool declarations registered in `lib/assistant/assistant-tool-declarations.ts` / `app/api/chat/route.ts`.
- [ ] Tool execution loop handling tool execution and returning grounded responses.
- [ ] Currency (`₱`) and unit formatting verified in tool schemas and responses.
- [ ] Comprehensive unit tests covering each tool function with mocked Supabase and in-memory responses.
