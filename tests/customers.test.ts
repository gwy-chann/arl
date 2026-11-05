import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  customerInputSchema,
  type CustomerWithRollup,
} from '../lib/customers/customer-contracts.ts';
import {
  formatPeso,
  calculateCustomerBalance,
  formatCustomerBalance,
  filterCustomers,
  createCustomer,
  updateCustomer,
  getCustomerDirectory,
  getCustomerById,
  resetMemoryCustomerStore,
  validateCustomerInput,
} from '../lib/customers/customer-service.ts';

describe('Feature ARL-9: Customer Directory with Contact Book & Balance Rollup', () => {
  beforeEach(() => {
    resetMemoryCustomerStore();
  });

  describe('Validation & Input Rules', () => {
    it('Scenario 1: validates valid customer registration input', () => {
      const input = {
        name: "Aling Nena's Sari-Sari Store",
        phone: '0917 301 4488',
        address: 'Purok 3, Brgy. San Roque',
      };
      const result = validateCustomerInput(input);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data?.name, "Aling Nena's Sari-Sari Store");
      assert.strictEqual(result.data?.phone, '0917 301 4488');
      assert.strictEqual(result.data?.address, 'Purok 3, Brgy. San Roque');
    });

    it('rejects empty customer name', () => {
      const result = validateCustomerInput({
        name: '   ',
        phone: '0917 301 4488',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors?.name?.length);
    });

    it('rejects phone number with fewer than 7 digits/characters', () => {
      const result = validateCustomerInput({
        name: 'Test Store',
        phone: '12345',
      });
      assert.strictEqual(result.success, false);
      assert.ok(result.errors?.phone?.length);
    });

    it('defaults optional address to empty string when omitted', () => {
      const parsed = customerInputSchema.parse({
        name: 'Test Customer',
        phone: '0912 345 6789',
      });
      assert.strictEqual(parsed.address, '');
    });
  });

  describe('Scenario 1: Customer Registration & Persistence', () => {
    it('creates a new customer record in memory store', async () => {
      const customer = await createCustomer({
        name: "Aling Nena's Sari-Sari Store",
        phone: '0917 301 4488',
        address: 'Purok 3, Brgy. San Roque',
      });

      assert.ok(customer.id);
      assert.strictEqual(customer.name, "Aling Nena's Sari-Sari Store");
      assert.strictEqual(customer.phone, '0917 301 4488');
      assert.strictEqual(customer.address, 'Purok 3, Brgy. San Roque');
      assert.strictEqual(customer.purchase_count, 0);
      assert.strictEqual(customer.debt_balance, 0);

      const fetched = await getCustomerById(customer.id);
      assert.ok(fetched);
      assert.strictEqual(fetched.name, "Aling Nena's Sari-Sari Store");
    });
  });

  describe('Scenario 2: Real-Time Search Filtering', () => {
    const mockCustomers: CustomerWithRollup[] = [
      {
        id: 'k1',
        name: "Aling Nena's Sari-Sari Store",
        phone: '0917 301 4488',
        address: 'Purok 3, Brgy. San Roque',
        purchase_count: 4,
        debt_balance: 1340,
        created_at: '2026-10-01T08:00:00Z',
        updated_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'k2',
        name: 'Mang Tonyo Carinderia',
        phone: '0928 554 1290',
        address: 'Public Market Stall 14',
        purchase_count: 5,
        debt_balance: 240,
        created_at: '2026-10-02T08:00:00Z',
        updated_at: '2026-10-02T08:00:00Z',
      },
      {
        id: 'k3',
        name: 'Lola Remedios Eatery',
        phone: '0935 882 7013',
        address: 'Rizal St., Brgy. Poblacion',
        purchase_count: 3,
        debt_balance: 0,
        created_at: '2026-10-03T08:00:00Z',
        updated_at: '2026-10-03T08:00:00Z',
      },
    ];

    it('filters customer records in real time when typing "Carinderia"', () => {
      const results = filterCustomers(mockCustomers, 'Carinderia');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, 'Mang Tonyo Carinderia');
    });

    it('matches customer phone substring (e.g. "0917")', () => {
      const results = filterCustomers(mockCustomers, '0917');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, "Aling Nena's Sari-Sari Store");
    });

    it('matches customer address substring (e.g. "Poblacion")', () => {
      const results = filterCustomers(mockCustomers, 'Poblacion');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].name, 'Lola Remedios Eatery');
    });

    it('is case-insensitive for search queries', () => {
      const results = filterCustomers(mockCustomers, 'carinderia');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'k2');
    });

    it('returns empty list when no customers match', () => {
      const results = filterCustomers(mockCustomers, 'NonExistentStore123');
      assert.strictEqual(results.length, 0);
    });

    it('returns all customers when search query is empty or whitespace', () => {
      const results = filterCustomers(mockCustomers, '   ');
      assert.strictEqual(results.length, 3);
    });
  });

  describe('Scenario 3: Debt Balance Highlighting', () => {
    it('highlights outstanding debt ₱1,340.00 in destructive red (text-danger)', () => {
      const balance = 1340.0;
      const result = formatCustomerBalance(balance);

      assert.strictEqual(result.isIndebted, true);
      assert.strictEqual(result.formatted, '₱1,340.00');
      assert.ok(
        result.displayClass.includes('text-danger'),
        'Must contain text-danger class for destructive red highlight'
      );
    });

    it('highlights partial debt of ₱240.00 in destructive red', () => {
      const result = formatCustomerBalance(240.0);
      assert.strictEqual(result.isIndebted, true);
      assert.strictEqual(result.formatted, '₱240.00');
      assert.ok(result.displayClass.includes('text-danger'));
    });
  });

  describe('Scenario 4: Fully Paid Balance Display', () => {
    it('displays a muted dash (-) indicating zero debt when customer has zero unpaid sales', () => {
      const balance = 0.0;
      const result = formatCustomerBalance(balance);

      assert.strictEqual(result.isIndebted, false);
      assert.strictEqual(result.formatted, '-');
      assert.ok(
        result.displayClass.includes('text-text-muted'),
        'Must contain text-text-muted class for zero debt'
      );
    });

    it('formats peso amounts consistently with two decimal places', () => {
      assert.strictEqual(formatPeso(1340), '₱1,340.00');
      assert.strictEqual(formatPeso(0), '₱0.00');
    });
  });

  describe('Balance Rollup & Aggregation Logic', () => {
    it('fetches full customer directory with seeded rollups', async () => {
      const dir = await getCustomerDirectory();
      assert.ok(dir.length >= 8);
      const nena = dir.find((c) => c.id === 'k1');
      assert.ok(nena);
      assert.strictEqual(nena.debt_balance, 1340);
      assert.strictEqual(nena.purchase_count, 4);
    });
    it('calculates balance across multiple sales accurately', () => {
      const sales = [
        { total_amount: 500, amount_paid: 500 }, // paid (0)
        { total_amount: 1000, amount_paid: 300 }, // partially paid (700)
        { total_amount: 640, amount_paid: 0 }, // unpaid (640)
      ];
      const totalBalance = calculateCustomerBalance(sales);
      assert.strictEqual(totalBalance, 1340);
    });

    it('returns 0 when all sales are fully paid', () => {
      const sales = [
        { total_amount: 500, amount_paid: 500 },
        { total_amount: 120, amount_paid: 120 },
      ];
      const totalBalance = calculateCustomerBalance(sales);
      assert.strictEqual(totalBalance, 0);
    });

    it('handles customer with no transactions gracefully', () => {
      const totalBalance = calculateCustomerBalance([]);
      assert.strictEqual(totalBalance, 0);
      const display = formatCustomerBalance(totalBalance);
      assert.strictEqual(display.formatted, '-');
    });

    it('updates existing customer details cleanly', async () => {
      const updated = await updateCustomer('k1', {
        name: "Aling Nena's Super Store",
        phone: '0917 999 8888',
        address: 'Purok 5, Brgy. San Roque',
      });

      assert.strictEqual(updated.name, "Aling Nena's Super Store");
      assert.strictEqual(updated.phone, '0917 999 8888');

      const fetched = await getCustomerById('k1');
      assert.strictEqual(fetched?.name, "Aling Nena's Super Store");
    });
  });
});
