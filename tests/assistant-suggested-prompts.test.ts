import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  QuickPromptCategorySchema,
  QuickPromptItemSchema,
  SUGGESTED_QUICK_PROMPTS,
  getGroupedQuickPrompts,
  containsEmoji,
  type QuickPromptItem,
  type QuickPromptCategory,
} from '../lib/assistant/assistant-contracts.ts';

describe('Curated Suggested Questions & Quick-Prompt Starters (ARL-31)', () => {
  describe('Zod Schema Validation', () => {
    test('QuickPromptCategorySchema validates allowed categories and rejects unknown ones', () => {
      const validCategories: QuickPromptCategory[] = [
        'inventory',
        'sales',
        'customers',
        'settings',
      ];

      for (const cat of validCategories) {
        assert.strictEqual(QuickPromptCategorySchema.safeParse(cat).success, true);
      }

      assert.strictEqual(QuickPromptCategorySchema.safeParse('billing').success, false);
      assert.strictEqual(QuickPromptCategorySchema.safeParse('marketing').success, false);
      assert.strictEqual(QuickPromptCategorySchema.safeParse('').success, false);
    });

    test('QuickPromptItemSchema validates complete prompt item structure', () => {
      const item: QuickPromptItem = {
        id: 'qp-test',
        category: 'inventory',
        categoryLabel: 'Inventory',
        shortLabel: 'Check stock',
        prompt: 'Check stock of Patis 1L',
      };

      const result = QuickPromptItemSchema.safeParse(item);
      assert.strictEqual(result.success, true);
    });

    test('QuickPromptItemSchema rejects empty or malformed prompt items', () => {
      assert.strictEqual(
        QuickPromptItemSchema.safeParse({
          id: '',
          category: 'inventory',
          categoryLabel: 'Inventory',
          shortLabel: 'Check',
          prompt: 'Check stock',
        }).success,
        false
      );

      assert.strictEqual(
        QuickPromptItemSchema.safeParse({
          id: 'qp-1',
          category: 'invalid',
          categoryLabel: 'Invalid',
          shortLabel: 'Check',
          prompt: 'Check stock',
        }).success,
        false
      );
    });
  });

  describe('Curated Prompt Catalog Invariants', () => {
    test('catalog contains exactly 7 curated operational prompts', () => {
      assert.strictEqual(SUGGESTED_QUICK_PROMPTS.length, 7);
    });

    test('all catalog items pass schema validation', () => {
      for (const item of SUGGESTED_QUICK_PROMPTS) {
        const parsed = QuickPromptItemSchema.safeParse(item);
        assert.strictEqual(parsed.success, true);
      }
    });

    test('catalog has zero emoji characters across all labels, headers, and prompts (Zero-Emoji Invariant)', () => {
      for (const item of SUGGESTED_QUICK_PROMPTS) {
        assert.strictEqual(
          containsEmoji(item.id),
          false,
          `Emoji found in ID: ${item.id}`
        );
        assert.strictEqual(
          containsEmoji(item.categoryLabel),
          false,
          `Emoji found in categoryLabel: ${item.categoryLabel}`
        );
        assert.strictEqual(
          containsEmoji(item.shortLabel),
          false,
          `Emoji found in shortLabel: ${item.shortLabel}`
        );
        assert.strictEqual(
          containsEmoji(item.prompt),
          false,
          `Emoji found in prompt: ${item.prompt}`
        );
      }
    });

    test('catalog defines unique prompt IDs', () => {
      const ids = SUGGESTED_QUICK_PROMPTS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(ids.length, uniqueIds.size);
    });

    test('exact catalog prompt items match Jira specification (Scenario 1 & 2 requirements)', () => {
      const itemMap = new Map(SUGGESTED_QUICK_PROMPTS.map((p) => [p.id, p]));

      // 1. Low stock audit
      const lowStock = itemMap.get('qp-low-stock');
      assert.ok(lowStock);
      assert.strictEqual(lowStock?.category, 'inventory');
      assert.strictEqual(lowStock?.shortLabel, 'Low stock items');
      assert.strictEqual(lowStock?.prompt, 'Which products are currently low on stock?');

      // 2. Toyo 1L lookup
      const toyo1l = itemMap.get('qp-stock-toyo-1l');
      assert.ok(toyo1l);
      assert.strictEqual(toyo1l?.category, 'inventory');
      assert.strictEqual(toyo1l?.shortLabel, '1L Toyo stock');
      assert.strictEqual(
        toyo1l?.prompt,
        'Check current stock count and pricing for 1L Toyo'
      );

      // 3. Today's sales
      const todaySales = itemMap.get('qp-today-sales');
      assert.ok(todaySales);
      assert.strictEqual(todaySales?.category, 'sales');
      assert.strictEqual(todaySales?.shortLabel, "Today's sales");
      assert.strictEqual(
        todaySales?.prompt,
        "Summarize today's sales and payment methods"
      );

      // 4. Best sellers
      const bestSellers = itemMap.get('qp-best-sellers');
      assert.ok(bestSellers);
      assert.strictEqual(bestSellers?.category, 'sales');
      assert.strictEqual(bestSellers?.shortLabel, 'Best sellers');
      assert.strictEqual(
        bestSellers?.prompt,
        'Which condiment sizes had the highest sales volume this week?'
      );

      // 5. Overdue utang
      const overdueUtang = itemMap.get('qp-overdue-utang');
      assert.ok(overdueUtang);
      assert.strictEqual(overdueUtang?.category, 'customers');
      assert.strictEqual(overdueUtang?.shortLabel, 'Overdue utang');
      assert.strictEqual(overdueUtang?.prompt, 'Who has overdue utang balances?');

      // 6. Customer balances
      const allBalances = itemMap.get('qp-all-balances');
      assert.ok(allBalances);
      assert.strictEqual(allBalances?.category, 'customers');
      assert.strictEqual(allBalances?.shortLabel, 'Customer balances');
      assert.strictEqual(
        allBalances?.prompt,
        'List all customers with unpaid balances sorted by amount'
      );

      // 7. Store rules
      const storeRules = itemMap.get('qp-store-rules');
      assert.ok(storeRules);
      assert.strictEqual(storeRules?.category, 'settings');
      assert.strictEqual(storeRules?.shortLabel, 'Reminder rules');
      assert.strictEqual(
        storeRules?.prompt,
        'What is our current overdue credit reminder policy and SMS schedule?'
      );
    });
  });

  describe('getGroupedQuickPrompts Grouping Helper', () => {
    test('groups canonical prompts into 4 operational categories in correct order', () => {
      const grouped = getGroupedQuickPrompts();

      assert.strictEqual(grouped.length, 4);
      assert.strictEqual(grouped[0].category, 'inventory');
      assert.strictEqual(grouped[0].categoryLabel, 'Inventory');
      assert.strictEqual(grouped[0].items.length, 2);

      assert.strictEqual(grouped[1].category, 'sales');
      assert.strictEqual(grouped[1].categoryLabel, 'Sales & Revenue');
      assert.strictEqual(grouped[1].items.length, 2);

      assert.strictEqual(grouped[2].category, 'customers');
      assert.strictEqual(grouped[2].categoryLabel, 'Customer Credit');
      assert.strictEqual(grouped[2].items.length, 2);

      assert.strictEqual(grouped[3].category, 'settings');
      assert.strictEqual(grouped[3].categoryLabel, 'Store Rules');
      assert.strictEqual(grouped[3].items.length, 1);
    });

    test('correctly handles empty prompt list', () => {
      const grouped = getGroupedQuickPrompts([]);
      assert.strictEqual(grouped.length, 0);
    });

    test('omits categories that have no items', () => {
      const subset: QuickPromptItem[] = [
        {
          id: 'qp-test-sales',
          category: 'sales',
          categoryLabel: 'Sales & Revenue',
          shortLabel: 'Sales',
          prompt: 'Show sales',
        },
      ];

      const grouped = getGroupedQuickPrompts(subset);
      assert.strictEqual(grouped.length, 1);
      assert.strictEqual(grouped[0].category, 'sales');
    });
  });
});
