# Feature Specification: Curated Suggested Questions & Quick-Prompt Starters

**Feature Key**: `ARL-31`  
**Feature Slug**: `018-curated-suggested-questions`  
**Jira Story**: STORY-6.2: Curated Suggested Questions & Quick-Prompt Starters  
**Parent Epic**: EPIC-6: In-App AI Operational Assistant (Gemini Flash Free Tier) (`ARL-29`)  
**Status**: Ready for Implementation  

---

## 1. User Story

* **As an** ARLQ store administrator,
* **I want** to see curated, clickable suggested operational questions when opening the assistant or clearing a session,
* **so that** I can retrieve common inventory stock counts, sales metrics, and customer credit (utang) reports with a single click without manual typing or friction.

---

## 2. Business Value & Operational Context

In the fast-paced retail condiment trade (handling 9 core variants: Toyo, Suka, and Patis in 350ml, 1L, and 1gal packaging sizes), store administrators frequently need immediate answers to recurring operational questions:
- Checking low stock before placing replenishment orders with suppliers.
- Tallying end-of-day sales totals and payment breakdowns across cash, GCash, and credit.
- Auditing overdue customer utang balances and checking reminder schedules.

Providing curated quick-prompt starters:
1. **Eliminates Blank-Canvas Friction**: Administrators don't have to ponder what to ask or how to phrase queries.
2. **Guides Query Phrasing for Grounding Tools**: Prompts are formulated to map directly into backend read-only grounding functions (`getInventorySummary`, `getSalesOverview`, `getCustomerBalances`, `getStoreSettings`).
3. **Accelerates Routine Audits**: 1-click execution allows quick store reviews in seconds on both desktop and mobile views.
4. **Enforces Brand & Professional Standards**: Zero emojis, minimalist design, consistent typography, and semantic theme tokens adhering to ARLQ constitution.

---

## 3. Curated Question Catalog & Categorization

The catalog defines 4 distinct operational categories with 7 curated prompt items:

### 1. Inventory & Stock Health (`inventory` / `Inventory`)
1. **Low Stock Audit**
   - **ID**: `qp-low-stock`
   - **Chip Label**: `Low stock items`
   - **Dispatched Prompt**: `"Which products are currently low on stock?"`
   - **Target Behavior**: Triggers inventory summary filtered for variants where `stock_quantity <= min_stock_level`.
2. **Variant Stock Lookup**
   - **ID**: `qp-stock-toyo-1l`
   - **Chip Label**: `1L Toyo stock`
   - **Dispatched Prompt**: `"Check current stock count and pricing for 1L Toyo"`
   - **Target Behavior**: Returns exact bottles on hand, cost price, and retail selling price for Toyo 1L.

### 2. Sales & Revenue Operations (`sales` / `Sales & Revenue`)
3. **Daily Performance**
   - **ID**: `qp-today-sales`
   - **Chip Label**: `Today's sales`
   - **Dispatched Prompt**: `"Summarize today's sales and payment methods"`
   - **Target Behavior**: Returns transaction count, total gross revenue, cash collected, and outstanding balance split for today.
4. **Condiment Breakdown**
   - **ID**: `qp-best-sellers`
   - **Chip Label**: `Best sellers`
   - **Dispatched Prompt**: `"Which condiment sizes had the highest sales volume this week?"`
   - **Target Behavior**: Aggregates sales volume by condiment variant over the preceding 7 days.

### 3. Customer Credit & Debt (Utang) (`customers` / `Customer Credit`)
5. **Overdue Credit Audit**
   - **ID**: `qp-overdue-utang`
   - **Chip Label**: `Overdue utang`
   - **Dispatched Prompt**: `"Who has overdue utang balances?"`
   - **Target Behavior**: Retrieves customers with unpaid or partially paid transactions older than the store's 7-day reminder threshold.
6. **Outstanding Balances**
   - **ID**: `qp-all-balances`
   - **Chip Label**: `Customer balances`
   - **Dispatched Prompt**: `"List all customers with unpaid balances sorted by amount"`
   - **Target Behavior**: Lists indebted customer accounts with total balance owed.

### 4. Store Configuration & Rules (`settings` / `Store Rules`)
7. **Credit & SMS Policy**
   - **ID**: `qp-store-rules`
   - **Chip Label**: `Reminder rules`
   - **Dispatched Prompt**: `"What is our current overdue credit reminder policy and SMS schedule?"`
   - **Target Behavior**: Explains the 7-day threshold and automated dual SMS reminder mechanism.

---

## 4. Business Invariants & UI Directives

1. **Visibility Lifecycle**:
   - The suggested questions view is rendered **exclusively** when `messages.length === 0`.
   - On the first user message submission (either via clicking a quick-prompt chip or typing into the input bar), the suggested questions panel transitions out and the active chat conversation view is displayed.
   - When the user clicks the "Clear" button in the assistant header, conversation history is cleared and the suggested questions view is instantly restored.

2. **Single-Action Trigger**:
   - Clicking a chip immediately invokes `sendMessage(item.prompt)`.
   - The input field is cleared and disabled while `status === 'loading'`.
   - The assistant enters `loading` status, displaying the typing indicator bubble ("Checking store records...").

3. **Zero Hardcoded Colors (Strict Compliance)**:
   - Card backgrounds: `bg-bg-surface` or `bg-bg-card`
   - Container border: `border-border`
   - Category headers: `text-text-muted text-[11px] font-semibold uppercase tracking-wider`
   - Chip button: `bg-bg-base hover:bg-bg-hover active:bg-bg-muted border border-border hover:border-border-focus text-text-primary text-xs font-medium`
   - Focus indicators: `focus-visible:ring-1 focus-visible:ring-border-focus focus-visible:outline-hidden`

4. **Zero-Emoji Compliance**:
   - Absolutely no Unicode emojis or emoji-like iconography in category headers, chip labels, button icons, or assistant messages.
   - Category icons use clean, single-stroke SVG line icons matching the ARLQ aesthetic.

5. **Accessibility & Keyboard Navigation**:
   - Chips are native HTML `<button type="button">` elements with accessible labels.
   - Keyboard users can tab smoothly through the chips with standard `Tab` / `Shift+Tab`.
   - Pressing `Enter` or `Space` activates the chip.
   - `aria-label` provided for screen readers describing the full prompt to be sent.

---

## 5. Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Initial Render & Category Presentation
* **Given** an authenticated administrator opens the assistant popover for the first time
* **And** the message history is empty (`messages.length === 0`)
* **When** the popover window renders
* **Then** the curated quick-prompts container is visible
* **And** displays categorized sections: Inventory, Sales & Revenue, Customer Credit, and Store Rules
* **And** all buttons conform to semantic theme tokens with zero hardcoded hex codes or emojis.

### Scenario 2: One-Click Instant Query Dispatch
* **Given** the suggested questions view is active
* **When** the user clicks the "Low stock items" chip
* **Then** the prompt `"Which products are currently low on stock?"` is dispatched immediately
* **And** a user chat bubble appears in the message stream with that exact text
* **And** the suggested questions view transitions out
* **And** the assistant state transitions to `loading` with the indicator "Checking store records...".

### Scenario 3: Restoration Upon Clearing Chat History
* **Given** an active chat stream with multiple conversation turns
* **When** the administrator clicks the "Clear" button in the assistant header
* **Then** all message history is wiped from the current view and `sessionStorage`
* **And** the curated suggested questions view is immediately restored in the empty popover.

### Scenario 4: Keyboard Navigation & Accessibility
* **Given** keyboard focus is inside the assistant popover
* **When** navigating with `Tab` and `Shift+Tab`
* **Then** focus moves logically across each quick-prompt button with visible `focus-visible:ring-1 focus-visible:ring-border-focus`
* **And** pressing `Enter` or `Space` on any button dispatches the selected prompt.

### Scenario 5: Universal Theme Verification
* **Given** the assistant popover is open displaying suggested questions
* **When** toggling between Light and Dark themes
* **Then** all chip backgrounds (`bg-bg-base`), borders (`border-border`), and text colors adapt seamlessly via CSS variables without broken contrast or unstyled surfaces.
