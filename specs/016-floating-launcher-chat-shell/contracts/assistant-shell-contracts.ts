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
 * Factory for creating a valid ChatMessage
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
