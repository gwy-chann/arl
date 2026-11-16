# Implementation Tasks: Curated Suggested Questions & Quick-Prompt Starters

**Feature Key**: `ARL-31`  
**Feature Slug**: `018-curated-suggested-questions`  
**Status**: Ready for Implementation  

---

## Task List

- [x] **Task 1: Define Quick-Prompt Contracts & Schemas**
  - **File**: `lib/assistant/assistant-contracts.ts`
  - Define `QuickPromptCategorySchema` (`inventory`, `sales`, `customers`, `settings`).
  - Define `QuickPromptItemSchema` and `QuickPromptItem` TypeScript interface.
  - Implement `SUGGESTED_QUICK_PROMPTS` constant containing the 7 curated prompts.
  - Implement `getGroupedQuickPrompts()` helper function.
  - Assert zero-emoji invariance across all prompt labels and text.

- [x] **Task 2: Implement Unit Tests for Suggested Prompts Catalog**
  - **File**: `tests/assistant-suggested-prompts.test.ts`
  - Test Zod validation of `QuickPromptCategorySchema` and `QuickPromptItemSchema`.
  - Verify `SUGGESTED_QUICK_PROMPTS` integrity (exact count, IDs, category mapping).
  - Verify strict zero-emoji enforcement across all catalog strings.
  - Verify `getGroupedQuickPrompts()` groups items into 4 distinct categories.

- [x] **Task 3: Build SuggestedQuestions Component**
  - **File**: `components/assistant/suggested-questions.tsx`
  - Implement `SuggestedQuestions` with props `onSelectPrompt(prompt: string)` and `disabled?: boolean`.
  - Render 4 category blocks with uppercase tracking headers and minimalist SVG line icons (zero emoji).
  - Render chip buttons with semantic tokens: `bg-bg-base hover:bg-bg-hover active:bg-bg-muted border border-border hover:border-border-focus text-text-primary text-xs font-medium`.
  - Implement accessible keyboard navigation and focus rings (`focus-visible:ring-1 focus-visible:ring-border-focus`).

- [x] **Task 4: Integrate SuggestedQuestions into Message List & Popover**
  - **Files**:
    - `components/assistant/assistant-message-list.tsx`
    - `components/assistant/assistant-popover.tsx`
    - `components/assistant/assistant-chat-widget.tsx`
  - Wire `SuggestedQuestions` to render cleanly inside the message list container when `messages.length === 0`.
  - Connect `onSelectPrompt` to `sendMessage(prompt)`.
  - Ensure unmounting/transition when `messages.length > 0`.
  - Verify restoration when `onClearMessages` is executed.

- [x] **Task 5: End-to-End Verification & Quality Gates**
  - Run `npx tsc --noEmit` to verify strict TypeScript compilation.
  - Run `npm test` to verify all 21 test suites pass without regression.
  - Review git status and prepare atomic commits following `.agents/rules/atomic-commit.md`.
