# Implementation Plan: Curated Suggested Questions & Quick-Prompt Starters

**Feature Key**: `ARL-31`  
**Feature Slug**: `018-curated-suggested-questions`  
**Jira Story**: STORY-6.2: Curated Suggested Questions & Quick-Prompt Starters  
**Parent Epic**: EPIC-6: In-App AI Operational Assistant (Gemini Flash Free Tier) (`ARL-29`)  

---

## 1. Technical Architecture & File Boundary Mapping

```
lib/assistant/
  └── assistant-contracts.ts
      ├── QuickPromptCategorySchema
      ├── QuickPromptItemSchema
      ├── SUGGESTED_QUICK_PROMPTS
      └── getGroupedQuickPrompts()

components/assistant/
  ├── suggested-questions.tsx         (NEW: Category headers, chip buttons, clean SVG icons)
  ├── assistant-message-list.tsx      (UPDATE: Host suggested questions inside scroll body when messages.length === 0)
  ├── assistant-popover.tsx           (UPDATE: Pass through suggested questions slot/props)
  └── assistant-chat-widget.tsx       (UPDATE: Wire onSelectPrompt to useAssistantChat.sendMessage)

tests/
  └── assistant-suggested-prompts.test.ts (NEW: Test catalog integrity, zero-emoji invariants, grouping helper)
```

---

## 2. Design Tokens & Styling Strategy

- Category Headers: `text-text-muted text-[11px] font-semibold uppercase tracking-wider`
- Section Icons: Minimalist 14x14 single-stroke SVG line icons using `text-text-muted` (Layers for inventory, TrendingUp for sales, Users for customers, ShieldAlert/Info for store rules).
- Chip Buttons:
  - Base: `bg-bg-base hover:bg-bg-hover active:bg-bg-muted border border-border hover:border-border-focus text-text-primary text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors`
  - Focus: `focus-visible:ring-1 focus-visible:ring-border-focus focus-visible:outline-hidden`
- Layout:
  - Contained inside the message list scrollable body under the welcome message so that on any screen size or viewport height, users can smoothly scroll the categories without UI overflow.
  - Category sections organized with clean vertical spacing (`space-y-3`).
  - Chips arranged in flexible flex-wrap rows (`flex flex-wrap gap-1.5`).

---

## 3. Test & Verification Plan

1. **Catalog & Contract Tests**:
   - Verify `SUGGESTED_QUICK_PROMPTS` has exactly 7 items across 4 categories.
   - Verify every item matches `QuickPromptItemSchema`.
   - Assert zero emojis across all `shortLabel`, `categoryLabel`, and `prompt`.
   - Test grouping utility `getGroupedQuickPrompts()`.
2. **Component & Integration Invariants**:
   - Verify suggested questions render when `messages.length === 0`.
   - Verify suggested questions hide when `messages.length > 0`.
   - Verify clicking a prompt invokes `sendMessage(prompt)`.
   - Verify session clear (`clearMessages`) resets message history and restores suggested questions.
3. **Typecheck & Lint**:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
