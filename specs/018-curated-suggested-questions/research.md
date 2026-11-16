# Research & Architectural Analysis: Curated Suggested Questions & Quick-Prompt Starters

**Feature Key**: `ARL-31`  
**Feature Slug**: `018-curated-suggested-questions`  
**Date**: November 2026  

---

## 1. Technical Context & Constraints

- **Framework**: Next.js 15 App Router with React 19 Client Components (`'use client'`).
- **Styling Architecture**: Tailwind CSS v4 using CSS variable references via semantic classes (`bg-bg-surface`, `bg-bg-base`, `bg-bg-hover`, `bg-bg-muted`, `border-border`, `border-border-focus`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-light`).
- **Zero Hardcoded Colors Invariant**: No inline hex (`#...`), rgb, or Tailwind default palette classes (`gray-900`, `blue-600`, etc.).
- **Zero Emoji Invariant**: No emojis anywhere in the UI or codebase. SVG line icons or minimalist typographic markers only.
- **Contract Validation**: Zod schema for quick prompt categories and items, ensuring compile-time and runtime type safety.
- **Test Harness**: Built-in Node test runner (`node:test`, `node:assert/strict`).

---

## 2. Integration Points Analysis

### 2.1 Contract & Data Layer (`lib/assistant/assistant-contracts.ts`)
We add:
1. `QuickPromptCategorySchema`: `z.enum(['inventory', 'sales', 'customers', 'settings'])`
2. `QuickPromptItemSchema`:
   - `id`: string
   - `category`: `QuickPromptCategorySchema`
   - `categoryLabel`: string
   - `shortLabel`: string
   - `prompt`: string
3. `SUGGESTED_QUICK_PROMPTS`: Canonical array of the 7 prompt items across the 4 categories.
4. `getPromptsByCategory()`: Helper function to group items by category for clean UI rendering.
5. Invariant assertion tests verifying zero emojis in all `shortLabel`, `categoryLabel`, and `prompt` strings.

### 2.2 Component Hierarchy & Container Structure
Currently, `AssistantPopover` has:
- `<AssistantHeader />`
- `<AssistantMessageList />`
- `<div data-testid="assistant-suggested-prompts">{suggestedPromptsSlot}</div>`
- `<AssistantInputBar />`

To provide the cleanest UX and adhere to the requirement:
- When `messages.length === 0`, `AssistantMessageList` displays the welcome card.
- Directly beneath the welcome card (or inside the scrollable message container), the suggested questions panel renders with all 4 categories.
- Placing `SuggestedQuestions` inside `AssistantMessageList` (or in the dedicated slot when `messages.length === 0`) allows users on smaller screens (or with 4 categories) to scroll through them naturally within the main popover body without squeezing the input bar or causing overflow issues.
- Alternatively, we wire `SuggestedQuestions` into `AssistantPopover` so that when `messages.length === 0`, `suggestedPromptsSlot` renders `<SuggestedQuestions onSelectPrompt={onSendMessage} />` by default if no custom slot is passed, or `AssistantMessageList` can host it directly.
- Let's inspect `AssistantPopover` and `AssistantMessageList`:
  - In `AssistantPopover`, `suggestedPromptsSlot` is rendered right above the input bar or inside the body. But `AssistantMessageList` has `messages.length === 0` which displays "Welcome to Store Assistant".
  - If we place `SuggestedQuestions` right inside `AssistantMessageList` when `messages.length === 0`, or provide it via `suggestedPromptsSlot`, the scrollable area handles all categories seamlessly without clipping!
  - Even better: `AssistantMessageList` can accept `suggestedPromptsSlot?: React.ReactNode` or `onSelectPrompt?: (prompt: string) => void`, OR `AssistantPopover` can pass it. Let's make `SuggestedQuestions` composable and exportable so it can be rendered cleanly.

### 2.3 Interaction Flow
1. User clicks a quick-prompt chip (e.g., "Low stock items").
2. Handler calls `onSelectPrompt(prompt.prompt)` (which forwards to `useAssistantChat.sendMessage(prompt)`).
3. `sendMessage` appends user message to `messages` array, sets input to empty, and sets `status = 'loading'`.
4. As `messages.length > 0`, the suggested questions view unmounts or hides.
5. Assistant message list auto-scrolls down to user message and typing indicator.
6. When response arrives, `status = 'idle'`.
7. User can continue typing or click "Clear" in header.
8. Clicking "Clear" sets `messages = []`, resetting the state and immediately restoring `SuggestedQuestions`.

---

## 3. Accessibility & Usability (WCAG 2.1 AA)

- Native HTML buttons (`<button type="button">`) ensuring native focusability and keyboard activation (`Enter`, `Space`).
- `focus-visible:ring-1 focus-visible:ring-border-focus` for high contrast focus rings in both light and dark themes.
- Clear `aria-label` stating "Ask: [prompt]".
- Responsive layout using CSS flexbox wrap / grid, ensuring chips break gracefully on narrow 320px mobile screens without overflowing.
