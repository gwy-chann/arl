# Data Model & Domain Entities: Curated Suggested Questions & Quick-Prompt Starters

**Feature Key**: `ARL-31`  
**Feature Slug**: `018-curated-suggested-questions`  
**Date**: November 2026  

---

## 1. Domain Entities & Type Definitions

```typescript
// Quick Prompt Categories
export type QuickPromptCategory = 'inventory' | 'sales' | 'customers' | 'settings';

// Quick Prompt Item Representation
export interface QuickPromptItem {
  id: string;
  category: QuickPromptCategory;
  categoryLabel: string;
  shortLabel: string;
  prompt: string;
}

// Grouped Prompt Structure for UI Rendering
export interface CategorizedQuickPrompts {
  category: QuickPromptCategory;
  categoryLabel: string;
  items: QuickPromptItem[];
}
```

---

## 2. Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const QuickPromptCategorySchema = z.enum([
  'inventory',
  'sales',
  'customers',
  'settings',
]);

export const QuickPromptItemSchema = z.object({
  id: z.string().min(1),
  category: QuickPromptCategorySchema,
  categoryLabel: z.string().min(1),
  shortLabel: z.string().min(1),
  prompt: z.string().min(1),
});

export const QuickPromptListSchema = z.array(QuickPromptItemSchema);
```

---

## 3. Canonical Catalog Definition

```typescript
export const SUGGESTED_QUICK_PROMPTS: readonly QuickPromptItem[] = [
  {
    id: 'qp-low-stock',
    category: 'inventory',
    categoryLabel: 'Inventory',
    shortLabel: 'Low stock items',
    prompt: 'Which products are currently low on stock?',
  },
  {
    id: 'qp-stock-toyo-1l',
    category: 'inventory',
    categoryLabel: 'Inventory',
    shortLabel: '1L Toyo stock',
    prompt: 'Check current stock count and pricing for 1L Toyo',
  },
  {
    id: 'qp-today-sales',
    category: 'sales',
    categoryLabel: 'Sales & Revenue',
    shortLabel: "Today's sales",
    prompt: "Summarize today's sales and payment methods",
  },
  {
    id: 'qp-best-sellers',
    category: 'sales',
    categoryLabel: 'Sales & Revenue',
    shortLabel: 'Best sellers',
    prompt: 'Which condiment sizes had the highest sales volume this week?',
  },
  {
    id: 'qp-overdue-utang',
    category: 'customers',
    categoryLabel: 'Customer Credit',
    shortLabel: 'Overdue utang',
    prompt: 'Who has overdue utang balances?',
  },
  {
    id: 'qp-all-balances',
    category: 'customers',
    categoryLabel: 'Customer Credit',
    shortLabel: 'Customer balances',
    prompt: 'List all customers with unpaid balances sorted by amount',
  },
  {
    id: 'qp-store-rules',
    category: 'settings',
    categoryLabel: 'Store Rules',
    shortLabel: 'Reminder rules',
    prompt: 'What is our current overdue credit reminder policy and SMS schedule?',
  },
] as const;
```

---

## 4. State Machine & Transitions

```
[Assistant Closed / Launcher Pill]
         │
         ▼ (Click Pill)
[Assistant Open: messages.length === 0]
   ├── Render <AssistantHeader />
   ├── Render <AssistantMessageList /> (Empty state welcome card)
   ├── Render <SuggestedQuestions /> (Categorized 4 sections, 7 chips)
   └── Render <AssistantInputBar /> (Idle, enabled)
         │
         ├── User clicks Prompt Chip OR Submits typed query
         │      │
         │      ▼
         │   [Assistant Open: messages.length > 0]
         │      ├── Unmount / Hide <SuggestedQuestions />
         │      ├── Append user message to `messages`
         │      ├── Set `status = 'loading'` (Typing indicator active)
         │      ├── Lock / disable input submission
         │      └── Fetch reply from /api/chat
         │
         └── User clicks "Clear" in header
                │
                ▼
             [Assistant Reset: messages.length === 0]
                ├── Wipe `sessionStorage`
                ├── Reset `messages = []`
                └── Instantly restore <SuggestedQuestions />
```
