import { z } from 'zod';

/**
 * Roles allowed in assistant conversation
 */
export const ChatRoleSchema = z.enum(['user', 'assistant', 'system']);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

/**
 * Single chat message validation schema
 */
export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: ChatRoleSchema,
  content: z.string().min(1),
  timestamp: z.string().datetime().or(z.string()),
  status: z.enum(['sending', 'delivered', 'error']).optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Input submission schema
 */
export const SendMessageInputSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty'),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

/**
 * Assistant operational status
 */
export const AssistantStatusSchema = z.enum(['idle', 'loading', 'error']);
export type AssistantStatus = z.infer<typeof AssistantStatusSchema>;

/**
 * Default welcome message text (Guaranteed Zero-Emoji)
 */
export const DEFAULT_WELCOME_MESSAGE = 'Ask questions about store inventory, sales, customer utang balances, or pricing.';

/**
 * Launcher label text
 */
export const LAUNCHER_LABEL = 'Store Assistant';

/**
 * Regex matching standard Unicode emojis and symbols
 */
export const EMOJI_REGEX = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F680}-\u{1F6C0}\u{1F004}\u{1F0CF}]/u;

/**
 * Helper to assert that a string contains NO emojis (Strict Zero-Emoji Invariant)
 */
export function containsEmoji(text: string): boolean {
  return EMOJI_REGEX.test(text);
}

/**
 * Factory for creating a valid ChatMessage with zero-emoji enforcement
 */
export function createChatMessage(
  role: ChatRole,
  content: string,
  id?: string
): ChatMessage {
  if (containsEmoji(content)) {
    throw new Error('Violation of Zero-Emoji Policy: Message content cannot contain emojis');
  }

  return {
    id: id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    role,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    status: 'delivered',
  };
}

/**
 * Formats ISO timestamp for clean in-shell display (e.g. "10:45 AM")
 */
export function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Operational categories for quick-prompt starters
 */
export const QuickPromptCategorySchema = z.enum([
  'inventory',
  'sales',
  'customers',
  'settings',
]);
export type QuickPromptCategory = z.infer<typeof QuickPromptCategorySchema>;

/**
 * Single quick-prompt item schema
 */
export const QuickPromptItemSchema = z.object({
  id: z.string().min(1),
  category: QuickPromptCategorySchema,
  categoryLabel: z.string().min(1),
  shortLabel: z.string().min(1),
  prompt: z.string().min(1),
});
export type QuickPromptItem = z.infer<typeof QuickPromptItemSchema>;

/**
 * Grouped quick-prompts for categorized UI presentation
 */
export interface CategorizedQuickPrompts {
  category: QuickPromptCategory;
  categoryLabel: string;
  items: QuickPromptItem[];
}

/**
 * Canonical Curated Quick-Prompt Starters Catalog (Zero-Emoji Guarantee)
 */
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

/**
 * Groups prompt items by operational category maintaining canonical display order
 */
export function getGroupedQuickPrompts(
  prompts: readonly QuickPromptItem[] = SUGGESTED_QUICK_PROMPTS
): CategorizedQuickPrompts[] {
  const categoryOrder: QuickPromptCategory[] = [
    'inventory',
    'sales',
    'customers',
    'settings',
  ];

  const map = new Map<QuickPromptCategory, { label: string; items: QuickPromptItem[] }>();

  for (const p of prompts) {
    const existing = map.get(p.category);
    if (existing) {
      existing.items.push(p);
    } else {
      map.set(p.category, { label: p.categoryLabel, items: [p] });
    }
  }

  const result: CategorizedQuickPrompts[] = [];
  for (const cat of categoryOrder) {
    const group = map.get(cat);
    if (group && group.items.length > 0) {
      result.push({
        category: cat,
        categoryLabel: group.label,
        items: group.items,
      });
    }
  }

  return result;
}

