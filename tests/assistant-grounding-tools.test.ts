import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPhilippinePeso,
  formatPackagingSize,
  InventorySummaryInputSchema,
  SalesOverviewInputSchema,
  CustomerBalancesInputSchema,
  ASSISTANT_TOOL_DECLARATIONS,
  type AssistantToolName,
} from '../lib/assistant/assistant-grounding-contracts.ts';
import {
  getInventorySummary,
  getSalesOverview,
  getCustomerBalances,
  getStoreSettings,
  executeToolCall,
} from '../lib/assistant/assistant-tools.ts';
import { POST } from '../app/api/chat/route.ts';

describe('Read-Only Database Grounding Tools (ARL-32)', () => {
  before(() => {
    process.env.ASSISTANT_OFFLINE_MODE = 'true';
  });

  after(() => {
    delete process.env.ASSISTANT_OFFLINE_MODE;
  });
  describe('Contracts, Schemas & Formatting Invariants', () => {
    test('formatPhilippinePeso produces exact currency format with peso sign', () => {
      assert.strictEqual(formatPhilippinePeso(1250), '₱1,250.00');
      assert.strictEqual(formatPhilippinePeso(0), '₱0.00');
      assert.strictEqual(formatPhilippinePeso(45.5), '₱45.50');
      assert.strictEqual(formatPhilippinePeso(1000000), '₱1,000,000.00');
    });

    test('formatPackagingSize normalizes raw size inputs to domain standards', () => {
      assert.strictEqual(formatPackagingSize('350'), '350 ml');
      assert.strictEqual(formatPackagingSize('350ml'), '350 ml');
      assert.strictEqual(formatPackagingSize('350 ML'), '350 ml');
      assert.strictEqual(formatPackagingSize('1L'), '1 L');
      assert.strictEqual(formatPackagingSize('1 l'), '1 L');
      assert.strictEqual(formatPackagingSize('1 liter'), '1 L');
      assert.strictEqual(formatPackagingSize('gal'), '1 gal');
      assert.strictEqual(formatPackagingSize('1gal'), '1 gal');
      assert.strictEqual(formatPackagingSize('1 gal'), '1 gal');
    });

    test('validates input schemas correctly and rejects invalid arguments', () => {
      // Inventory
      assert.strictEqual(InventorySummaryInputSchema.safeParse({}).success, true);
      assert.strictEqual(
        InventorySummaryInputSchema.safeParse({ searchQuery: 'Toyo', lowStockOnly: true }).success,
        true
      );
      assert.strictEqual(
        InventorySummaryInputSchema.safeParse({ lowStockOnly: 'not-a-bool' }).success,
        false
      );

      // Sales Overview
      assert.strictEqual(
        SalesOverviewInputSchema.safeParse({ timeframe: 'today' }).success,
        true
      );
      assert.strictEqual(
        SalesOverviewInputSchema.safeParse({ timeframe: 'invalid_frame' }).success,
        false
      );
      assert.strictEqual(
        SalesOverviewInputSchema.safeParse({}).success,
        false // timeframe is required
      );

      // Customer Balances
      assert.strictEqual(CustomerBalancesInputSchema.safeParse({}).success, true);
      assert.strictEqual(
        CustomerBalancesInputSchema.safeParse({ overdueOnly: true, customerName: 'Juan' }).success,
        true
      );
    });

    test('tool declarations register exactly 4 read-only functions with zero mutation operations', () => {
      assert.strictEqual(ASSISTANT_TOOL_DECLARATIONS.length, 4);

      const registeredNames = ASSISTANT_TOOL_DECLARATIONS.map((t) => t.name);
      assert.deepStrictEqual(registeredNames, [
        'getInventorySummary',
        'getSalesOverview',
        'getCustomerBalances',
        'getStoreSettings',
      ]);

      // Strict Read-Only Verification: zero write/mutation operations
      for (const declaration of ASSISTANT_TOOL_DECLARATIONS) {
        const lowerName = declaration.name.toLowerCase();
        const lowerDesc = declaration.description.toLowerCase();
        assert.strictEqual(lowerName.includes('create'), false);
        assert.strictEqual(lowerName.includes('update'), false);
        assert.strictEqual(lowerName.includes('delete'), false);
        assert.strictEqual(lowerName.includes('drop'), false);
        assert.strictEqual(lowerName.includes('insert'), false);

        assert.strictEqual(lowerDesc.includes('insert'), false);
        assert.strictEqual(lowerDesc.includes('delete'), false);
        assert.strictEqual(lowerDesc.includes('modify'), false);
      }
    });
  });

  describe('Scenario 1: Grounded Low-Stock Inquiry', () => {
    test('getInventorySummary with lowStockOnly returns exclusively items at or below minimum threshold', async () => {
      const summary = await getInventorySummary({ lowStockOnly: true });

      assert.strictEqual(typeof summary.totalVariants, 'number');
      assert.strictEqual(typeof summary.lowStockCount, 'number');
      assert.strictEqual(summary.items.length, summary.lowStockCount);

      for (const item of summary.items) {
        assert.strictEqual(item.isLowStock, true);
        assert.strictEqual(item.stockQuantity <= item.minStockLevel, true);
        assert.strictEqual(
          ['350 ml', '1 L', '1 gal'].includes(item.size),
          true,
          `Invalid size label: ${item.size}`
        );
        assert.strictEqual(item.formattedSellingPrice.startsWith('₱'), true);
      }
    });
  });

  describe('Scenario 2: Variant-Specific Pricing and Count Lookup', () => {
    test('getInventorySummary filters by condiment name (e.g. Patis)', async () => {
      const summary = await getInventorySummary({ searchQuery: 'Patis' });

      assert.strictEqual(summary.items.length > 0, true);
      for (const item of summary.items) {
        assert.strictEqual(
          item.productName.toLowerCase().includes('patis') ||
            item.variantName.toLowerCase().includes('patis'),
          true
        );
        assert.strictEqual(typeof item.sellingPrice, 'number');
        assert.strictEqual(typeof item.stockQuantity, 'number');
        assert.strictEqual(typeof item.costPrice, 'number');
        assert.strictEqual(item.formattedSellingPrice.startsWith('₱'), true);
      }
    });
  });

  describe('Scenario 3: Daily Sales Revenue Aggregation', () => {
    test('getSalesOverview aggregates sales metrics across specified timeframes', async () => {
      const todayOverview = await getSalesOverview({ timeframe: 'today' });

      assert.strictEqual(todayOverview.timeframe, 'today');
      assert.strictEqual(typeof todayOverview.totalSalesCount, 'number');
      assert.strictEqual(typeof todayOverview.totalGrossRevenue, 'number');
      assert.strictEqual(typeof todayOverview.totalCashCollected, 'number');
      assert.strictEqual(typeof todayOverview.totalOutstandingBalance, 'number');

      // Formatted representations
      assert.strictEqual(todayOverview.formattedGrossRevenue.startsWith('₱'), true);
      assert.strictEqual(todayOverview.formattedCashCollected.startsWith('₱'), true);
      assert.strictEqual(todayOverview.formattedOutstandingBalance.startsWith('₱'), true);

      // Payment breakdown consistency
      const { paidCount, partiallyPaidCount, notPaidCount } = todayOverview.paymentBreakdown;
      assert.strictEqual(paidCount + partiallyPaidCount + notPaidCount, todayOverview.totalSalesCount);

      // Other timeframes
      const allOverview = await getSalesOverview({ timeframe: 'all' });
      assert.strictEqual(allOverview.timeframe, 'all');
      assert.strictEqual(allOverview.totalSalesCount >= todayOverview.totalSalesCount, true);
    });
  });

  describe('Scenario 4: Overdue Utang Ledger Lookup', () => {
    test('getCustomerBalances retrieves indebted customers and filters overdue accounts', async () => {
      const allBalances = await getCustomerBalances({});

      assert.strictEqual(typeof allBalances.totalIndebtedCustomers, 'number');
      assert.strictEqual(typeof allBalances.totalOutstandingDebt, 'number');
      assert.strictEqual(allBalances.formattedOutstandingDebt.startsWith('₱'), true);

      for (const customer of allBalances.customers) {
        assert.strictEqual(customer.totalBalance > 0, true);
        assert.strictEqual(typeof customer.oldestUnpaidDays, 'number');
        assert.strictEqual(customer.formattedTotalBalance.startsWith('₱'), true);
      }

      // Overdue filter strictly returns accounts exceeding threshold (>= 7 days)
      const overdueBalances = await getCustomerBalances({ overdueOnly: true });
      for (const overdueCustomer of overdueBalances.customers) {
        assert.strictEqual(overdueCustomer.isOverdue, true);
        assert.strictEqual(overdueCustomer.oldestUnpaidDays >= 7, true);
        assert.strictEqual(overdueCustomer.totalBalance > 0, true);
      }
    });

    test('getCustomerBalances filters by customer partial name', async () => {
      const result = await getCustomerBalances({ customerName: 'Nena' });
      for (const customer of result.customers) {
        assert.strictEqual(customer.name.toLowerCase().includes('nena'), true);
      }
    });
  });

  describe('Scenario 5: Non-Existent Entity Handling', () => {
    test('searching for non-existent condiment (e.g. Mang Tomas) returns empty list without error', async () => {
      const summary = await getInventorySummary({ searchQuery: 'Mang Tomas' });
      assert.strictEqual(summary.items.length, 0);
      assert.strictEqual(summary.lowStockCount, 0);
      assert.strictEqual(summary.totalVariants, 0);
    });

    test('searching for non-existent customer returns empty customer array', async () => {
      const result = await getCustomerBalances({ customerName: 'NonExistentCustomerXYZ999' });
      assert.strictEqual(result.customers.length, 0);
      assert.strictEqual(result.totalIndebtedCustomers, 0);
      assert.strictEqual(result.totalOutstandingDebt, 0);
    });
  });

  describe('Store Settings & Unified Dispatcher', () => {
    test('getStoreSettings retrieves default operational policies', async () => {
      const settings = await getStoreSettings({});
      assert.strictEqual(typeof settings.storeName, 'string');
      assert.strictEqual(typeof settings.overdueReminderDays, 'number');
      assert.strictEqual(typeof settings.reminderPhone, 'string');
      assert.strictEqual(typeof settings.smsNotificationEnabled, 'boolean');
      assert.strictEqual(settings.overdueReminderDays, 7);
    });

    test('executeToolCall dispatches registered tools and throws on unknown tools', async () => {
      const inventory = (await executeToolCall('getInventorySummary', {
        lowStockOnly: true,
      })) as { lowStockCount: number };
      assert.strictEqual(typeof inventory.lowStockCount, 'number');

      const settings = (await executeToolCall('getStoreSettings', {})) as {
        overdueReminderDays: number;
      };
      assert.strictEqual(settings.overdueReminderDays, 7);

      await assert.rejects(
        async () => {
          await executeToolCall('createProduct' as unknown as AssistantToolName, {});
        },
        {
          message: /Unknown or unauthorized tool: createProduct/,
        }
      );
    });
  });

  describe('Chat Route API (/api/chat) Grounded Dispatch & Fallback', () => {
    test('POST /api/chat rejects invalid request body with 400', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'Invalid chat request payload');
    });

    test('POST /api/chat handles low-stock inquiry with getInventorySummary tool', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Which items are currently low on stock?' }],
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.role, 'assistant');
      assert.strictEqual(typeof data.content, 'string');
      assert.strictEqual(data.toolCallsExecuted.includes('getInventorySummary'), true);
      assert.strictEqual(data.content.length > 10, true);
    });

    test('POST /api/chat handles sales inquiry with getSalesOverview tool', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: "Summarize today's sales" }],
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.role, 'assistant');
      assert.strictEqual(data.toolCallsExecuted.includes('getSalesOverview'), true);
      assert.strictEqual(data.content.includes('₱'), true);
    });

    test('POST /api/chat handles overdue utang inquiry with getCustomerBalances tool', async () => {
      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Who has overdue utang?' }],
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.role, 'assistant');
      assert.strictEqual(data.toolCallsExecuted.includes('getCustomerBalances'), true);
    });
  });
});
