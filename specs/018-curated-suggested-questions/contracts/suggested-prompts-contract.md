# API & Component Contracts: Curated Suggested Questions

**Feature Key**: `ARL-31`  
**Feature Slug**: `018-curated-suggested-questions`  

---

## 1. Type & Schema Definitions

```typescript
// lib/assistant/assistant-contracts.ts

export type QuickPromptCategory = 'inventory' | 'sales' | 'customers' | 'settings';

export interface QuickPromptItem {
  id: string;
  category: QuickPromptCategory;
  categoryLabel: string;
  shortLabel: string;
  prompt: string;
}

export interface CategorizedQuickPrompts {
  category: QuickPromptCategory;
  categoryLabel: string;
  items: QuickPromptItem[];
}
```

---

## 2. Component Interface (`components/assistant/suggested-questions.tsx`)

```typescript
export interface SuggestedQuestionsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}
```

### Invariants:
1. `onSelectPrompt`: Invoked with `item.prompt` when a chip is clicked or activated with Enter/Space.
2. `disabled`: When true (e.g. while status is `'loading'`), buttons cannot be triggered.
3. No emojis rendered anywhere. SVG icons used for category headings (Box/Layers for Inventory, Chart/Trending for Sales, Users/Book for Customers, Shield/Sliders for Rules).

---

## 3. Popover Slot & Message List Integration

`AssistantPopoverProps` and `AssistantMessageListProps`:
- `suggestedPromptsSlot?: React.ReactNode` in `AssistantPopoverProps`
- When `messages.length === 0`, `SuggestedQuestions` is rendered, smoothly transitioning out once user dispatches a message.
