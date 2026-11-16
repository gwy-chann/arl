import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ChatRoleSchema,
  ChatMessageSchema,
  SendMessageInputSchema,
  containsEmoji,
  createChatMessage,
  formatMessageTime,
  DEFAULT_WELCOME_MESSAGE,
  LAUNCHER_LABEL,
  type ChatMessage,
} from '../lib/assistant/assistant-contracts.ts';

describe('Floating Launcher & Minimalist Lower-Right Chat Shell (ARL-30)', () => {
  describe('Constants & Zero-Emoji Brand Invariants', () => {
    test('launcher label conforms to specifications and contains zero emojis', () => {
      assert.strictEqual(LAUNCHER_LABEL, 'Store Assistant');
      assert.strictEqual(containsEmoji(LAUNCHER_LABEL), false);
    });

    test('default welcome message conforms to specifications and contains zero emojis', () => {
      assert.strictEqual(
        DEFAULT_WELCOME_MESSAGE,
        'Ask questions about store inventory, sales, customer utang balances, or pricing.'
      );
      assert.strictEqual(containsEmoji(DEFAULT_WELCOME_MESSAGE), false);
      assert.strictEqual(DEFAULT_WELCOME_MESSAGE.length > 10, true);
    });

    test('containsEmoji correctly flags diverse emoji glyphs and unicode symbols', () => {
      // Common emojis
      assert.strictEqual(containsEmoji('Hello 👋'), true);
      assert.strictEqual(containsEmoji('Store Bot 🤖'), true);
      assert.strictEqual(containsEmoji('Launch 🚀'), true);
      assert.strictEqual(containsEmoji('Tips 💡'), true);
      assert.strictEqual(containsEmoji('Alert ⚠️'), true);
      assert.strictEqual(containsEmoji('Sparkles ✨'), true);
      assert.strictEqual(containsEmoji('Chat 💬'), true);

      // Clean store operations text (must return false)
      assert.strictEqual(containsEmoji('Store Assistant'), false);
      assert.strictEqual(containsEmoji('Check Toyo and Suka 1L inventory'), false);
      assert.strictEqual(containsEmoji('Mang Tomas Sari-Sari Store outstanding utang balance is ₱1,250.00'), false);
      assert.strictEqual(containsEmoji('Clear message history'), false);
      assert.strictEqual(containsEmoji('Type your question here...'), false);
    });
  });

  describe('Contract Schemas & Validation', () => {
    test('ChatRoleSchema validates allowed roles and rejects invalid ones', () => {
      assert.strictEqual(ChatRoleSchema.safeParse('user').success, true);
      assert.strictEqual(ChatRoleSchema.safeParse('assistant').success, true);
      assert.strictEqual(ChatRoleSchema.safeParse('system').success, true);

      assert.strictEqual(ChatRoleSchema.safeParse('admin').success, false);
      assert.strictEqual(ChatRoleSchema.safeParse('bot').success, false);
      assert.strictEqual(ChatRoleSchema.safeParse('').success, false);
    });

    test('SendMessageInputSchema requires non-empty trimmed message', () => {
      const valid = SendMessageInputSchema.safeParse({ content: 'What is the stock of Patis 350ml?' });
      assert.strictEqual(valid.success, true);
      if (valid.success) {
        assert.strictEqual(valid.data.content, 'What is the stock of Patis 350ml?');
      }

      // Rejects empty or whitespace-only
      assert.strictEqual(SendMessageInputSchema.safeParse({ content: '' }).success, false);
      assert.strictEqual(SendMessageInputSchema.safeParse({ content: '   ' }).success, false);
      assert.strictEqual(SendMessageInputSchema.safeParse({}).success, false);
    });

    test('ChatMessageSchema validates complete chat message payload', () => {
      const payload: ChatMessage = {
        id: 'msg_123',
        role: 'user',
        content: 'Show sales for today',
        timestamp: new Date().toISOString(),
        status: 'delivered',
      };

      const result = ChatMessageSchema.safeParse(payload);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Message Factory & Zero-Emoji Enforcement', () => {
    test('createChatMessage creates a properly formatted message with generated ID and timestamp', () => {
      const msg = createChatMessage('user', 'How many 1gal Suka bottles left?');

      assert.strictEqual(msg.role, 'user');
      assert.strictEqual(msg.content, 'How many 1gal Suka bottles left?');
      assert.strictEqual(typeof msg.id, 'string');
      assert.strictEqual(msg.id.startsWith('msg_'), true);
      assert.strictEqual(msg.status, 'delivered');
      assert.strictEqual(typeof msg.timestamp, 'string');
    });

    test('createChatMessage trims surrounding whitespace', () => {
      const msg = createChatMessage('assistant', '   Toyo 350ml currently has 45 units in stock.   ');
      assert.strictEqual(msg.content, 'Toyo 350ml currently has 45 units in stock.');
    });

    test('createChatMessage throws error when message contains emoji (Zero-Emoji Policy)', () => {
      assert.throws(
        () => createChatMessage('assistant', 'Hello there! 👋 How can I assist?'),
        /Violation of Zero-Emoji Policy/
      );
    });
  });

  describe('Conversation State & Clear Reset Invariants', () => {
    test('message history accumulator and clear action behavior', () => {
      let history: ChatMessage[] = [];

      // Add user query
      const userMsg = createChatMessage('user', 'What is the total overdue balance?');
      history = [...history, userMsg];
      assert.strictEqual(history.length, 1);

      // Add assistant response
      const assistantMsg = createChatMessage(
        'assistant',
        'Total overdue balance across all sari-sari store accounts is ₱4,850.00.'
      );
      history = [...history, assistantMsg];
      assert.strictEqual(history.length, 2);
      assert.strictEqual(history[0].role, 'user');
      assert.strictEqual(history[1].role, 'assistant');

      // Clear action resets history
      history = [];
      assert.strictEqual(history.length, 0);
    });
  });

  describe('Timestamp Formatting', () => {
    test('formatMessageTime formats valid ISO timestamp without crashing', () => {
      const formatted = formatMessageTime('2026-11-17T10:30:00.000Z');
      assert.strictEqual(typeof formatted, 'string');
      assert.strictEqual(formatted.length > 0, true);
    });

    test('formatMessageTime returns empty string on invalid date input', () => {
      assert.strictEqual(formatMessageTime('invalid-date'), '');
      assert.strictEqual(formatMessageTime(''), '');
    });
  });
});
