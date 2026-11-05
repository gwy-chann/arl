import type { SupabaseClient } from '@supabase/supabase-js';
import {
  customerInputSchema,
  type CustomerInput,
  type CustomerProfileData,
  type CustomerWithRollup,
  type SaleSummary,
} from './customer-contracts.ts';

export function formatPeso(amount: number): string {
  return (
    '₱' +
    Number(amount || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function calculateCustomerBalance(
  sales: Array<{ total_amount: number; amount_paid: number }>
): number {
  return sales.reduce((acc, sale) => {
    const remaining = Math.max(0, (sale.total_amount || 0) - (sale.amount_paid || 0));
    return acc + remaining;
  }, 0);
}

export function getDaysOutstanding(
  createdAt: string,
  referenceDate: Date = new Date()
): number {
  const created = new Date(createdAt);
  const diffTime = referenceDate.getTime() - created.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

export function isSaleOverdue(
  daysOutstanding: number,
  thresholdDays: number = 7
): boolean {
  return daysOutstanding >= thresholdDays;
}

export interface FormattedBalance {
  formatted: string;
  isIndebted: boolean;
  displayClass: string;
  rawValue: number;
}

export function formatCustomerBalance(balance: number): FormattedBalance {
  const rounded = Math.round((balance + Number.EPSILON) * 100) / 100;
  if (rounded > 0) {
    return {
      formatted: formatPeso(rounded),
      isIndebted: true,
      displayClass: 'text-danger font-semibold',
      rawValue: rounded,
    };
  }
  return {
    formatted: '-',
    isIndebted: false,
    displayClass: 'text-text-muted',
    rawValue: 0,
  };
}

export function filterCustomers(
  customers: CustomerWithRollup[],
  query: string
): CustomerWithRollup[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return customers;

  return customers.filter((c) => {
    const nameMatch = c.name.toLowerCase().includes(trimmed);
    const phoneMatch = c.phone.toLowerCase().includes(trimmed);
    const addressMatch = (c.address || '').toLowerCase().includes(trimmed);
    return nameMatch || phoneMatch || addressMatch;
  });
}

// In-memory seeded store matching ARLQ domain model from mockup/app.js
const INITIAL_CUSTOMERS: CustomerWithRollup[] = [
  {
    id: 'k1',
    name: "Aling Nena's Sari-Sari Store",
    phone: '0917 301 4488',
    address: 'Purok 3, Brgy. San Roque',
    purchase_count: 4,
    debt_balance: 1340.0,
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'k2',
    name: 'Mang Tonyo Carinderia',
    phone: '0928 554 1290',
    address: 'Public Market Stall 14',
    purchase_count: 5,
    debt_balance: 240.0,
    created_at: '2026-10-02T08:00:00Z',
    updated_at: '2026-10-02T08:00:00Z',
  },
  {
    id: 'k3',
    name: 'Lola Remedios Eatery',
    phone: '0935 882 7013',
    address: 'Rizal St., Brgy. Poblacion',
    purchase_count: 3,
    debt_balance: 0.0,
    created_at: '2026-10-03T08:00:00Z',
    updated_at: '2026-10-03T08:00:00Z',
  },
  {
    id: 'k4',
    name: 'Kristine Dela Cruz',
    phone: '0906 447 2251',
    address: 'Lot 8, Mabini Subdivision',
    purchase_count: 1,
    debt_balance: 0.0,
    created_at: '2026-10-04T08:00:00Z',
    updated_at: '2026-10-04T08:00:00Z',
  },
  {
    id: 'k5',
    name: 'Bigasan ni Ben',
    phone: '0919 660 3382',
    address: 'National Highway, Brgy. Bagong Silang',
    purchase_count: 3,
    debt_balance: 0.0,
    created_at: '2026-10-05T08:00:00Z',
    updated_at: '2026-10-05T08:00:00Z',
  },
  {
    id: 'k6',
    name: 'Marites Food Stall',
    phone: '0945 213 9904',
    address: 'Terminal Road',
    purchase_count: 3,
    debt_balance: 0.0,
    created_at: '2026-10-06T08:00:00Z',
    updated_at: '2026-10-06T08:00:00Z',
  },
  {
    id: 'k7',
    name: 'Tito Boy Lechon Haus',
    phone: '0927 774 1156',
    address: 'Brgy. Santo Niño',
    purchase_count: 4,
    debt_balance: 300.0,
    created_at: '2026-10-07T08:00:00Z',
    updated_at: '2026-10-07T08:00:00Z',
  },
  {
    id: 'k8',
    name: "Jun-Jun's Turo-Turo",
    phone: '0998 120 6677',
    address: 'Corner Luna and Bonifacio St.',
    purchase_count: 2,
    debt_balance: 200.0,
    created_at: '2026-10-08T08:00:00Z',
    updated_at: '2026-10-08T08:00:00Z',
  },
];

const INITIAL_SALES: SaleSummary[] = [
  {
    id: 's1',
    receipt_number: 'ARLQ-01041',
    customer_id: 'k1',
    total_amount: 500,
    amount_paid: 500,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Delivered',
    created_at: '2026-10-10T09:00:00Z',
  },
  {
    id: 's2',
    receipt_number: 'ARLQ-01050',
    customer_id: 'k1',
    total_amount: 1340,
    amount_paid: 0,
    balance: 1340,
    payment_status: 'Not Yet Paid',
    order_status: 'Delivered',
    created_at: '2026-10-15T11:00:00Z',
  },
  {
    id: 's3',
    receipt_number: 'ARLQ-01045',
    customer_id: 'k2',
    total_amount: 650,
    amount_paid: 650,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Delivered',
    created_at: '2026-10-12T14:30:00Z',
  },
  {
    id: 's4',
    receipt_number: 'ARLQ-01063',
    customer_id: 'k2',
    total_amount: 560,
    amount_paid: 320,
    balance: 240,
    payment_status: 'Partially Paid',
    order_status: 'Pending',
    created_at: '2026-10-18T16:00:00Z',
  },
  {
    id: 's5',
    receipt_number: 'ARLQ-01048',
    customer_id: 'k4',
    total_amount: 120,
    amount_paid: 120,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Picked Up',
    created_at: '2026-10-14T10:00:00Z',
  },
  {
    id: 's6',
    receipt_number: 'ARLQ-01020',
    customer_id: 'k7',
    total_amount: 500,
    amount_paid: 500,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Delivered',
    created_at: '2026-10-05T08:00:00Z',
  },
  {
    id: 's7',
    receipt_number: 'ARLQ-01028',
    customer_id: 'k7',
    total_amount: 750,
    amount_paid: 750,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Delivered',
    created_at: '2026-10-09T10:00:00Z',
  },
  {
    id: 's8',
    receipt_number: 'ARLQ-01035',
    customer_id: 'k7',
    total_amount: 400,
    amount_paid: 400,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Picked Up',
    created_at: '2026-10-13T11:00:00Z',
  },
  {
    id: 's9',
    receipt_number: 'ARLQ-01052',
    customer_id: 'k7',
    total_amount: 600,
    amount_paid: 450,
    balance: 150,
    payment_status: 'Partially Paid',
    order_status: 'Pending',
    created_at: '2026-10-20T14:00:00Z',
  },
  {
    id: 's10',
    receipt_number: 'ARLQ-01058',
    customer_id: 'k7',
    total_amount: 450,
    amount_paid: 300,
    balance: 150,
    payment_status: 'Partially Paid',
    order_status: 'Delivered',
    created_at: '2026-10-25T15:30:00Z',
  },
];

let memoryCustomers: CustomerWithRollup[] = [...INITIAL_CUSTOMERS];
let memorySales: SaleSummary[] = [...INITIAL_SALES];

export function resetMemoryCustomerStore(): void {
  memoryCustomers = [...INITIAL_CUSTOMERS];
  memorySales = [...INITIAL_SALES];
}

export function validateCustomerInput(input: unknown): {
  success: boolean;
  data?: CustomerInput;
  errors?: Record<string, string[]>;
} {
  const result = customerInputSchema.safeParse(input);
  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString() || 'root';
      if (!errors[field]) errors[field] = [];
      errors[field].push(issue.message);
    }
    return { success: false, errors };
  }
  return { success: true, data: result.data };
}

export async function getCustomerDirectory(
  supabase?: SupabaseClient | null
): Promise<CustomerWithRollup[]> {
  if (supabase) {
    try {
      const { data: customersData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (custError) {
        console.warn('Supabase customers fetch error, falling back to memory store:', custError);
      } else if (customersData && customersData.length > 0) {
        const { data: salesData } = await supabase
          .from('sales')
          .select('id, customer_id, total_amount, amount_paid, payment_status');

        const salesByCustomer: Record<string, { count: number; balance: number }> = {};
        if (salesData) {
          for (const s of salesData) {
            const cid = s.customer_id;
            if (!salesByCustomer[cid]) salesByCustomer[cid] = { count: 0, balance: 0 };
            salesByCustomer[cid].count += 1;
            const bal = Math.max(0, Number(s.total_amount || 0) - Number(s.amount_paid || 0));
            salesByCustomer[cid].balance += bal;
          }
        }

        return customersData.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address || '',
          purchase_count: salesByCustomer[c.id]?.count || 0,
          debt_balance: salesByCustomer[c.id]?.balance || 0,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase query failed, using in-memory store:', err);
    }
  }

  return [...memoryCustomers].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomerById(
  id: string,
  supabase?: SupabaseClient | null
): Promise<CustomerProfileData | null> {
  if (supabase) {
    try {
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (!custError && customer) {
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .eq('customer_id', id)
          .order('created_at', { ascending: true });

        const sales: SaleSummary[] = (salesData || []).map((s) => {
          const balance = Math.max(0, Number(s.total_amount) - Number(s.amount_paid));
          const days = getDaysOutstanding(s.created_at);
          const overdue = balance > 0 && isSaleOverdue(days);
          return {
            id: s.id,
            receipt_number: s.receipt_number,
            customer_id: s.customer_id,
            total_amount: Number(s.total_amount),
            amount_paid: Number(s.amount_paid),
            balance,
            payment_status: s.payment_status,
            order_status: s.order_status,
            created_at: s.created_at,
            days_outstanding: days,
            is_overdue: overdue,
          };
        });

        const debt = calculateCustomerBalance(sales);

        return {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address || '',
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          debt_balance: debt,
          purchase_count: sales.length,
          sales,
        };
      }
    } catch (err) {
      console.warn('Supabase fetch customer failed, using memory store:', err);
    }
  }

  const found = memoryCustomers.find((c) => c.id === id);
  if (!found) return null;

  const rawSales = memorySales.filter((s) => s.customer_id === id);
  const sales: SaleSummary[] = rawSales
    .map((s) => {
      const days = s.days_outstanding ?? getDaysOutstanding(s.created_at);
      const overdue = s.is_overdue ?? (s.balance > 0 && isSaleOverdue(days));
      return {
        ...s,
        days_outstanding: days,
        is_overdue: overdue,
      };
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const debt = calculateCustomerBalance(sales);

  return {
    ...found,
    debt_balance: debt,
    purchase_count: sales.length,
    sales,
  };
}

export async function createCustomer(
  input: CustomerInput,
  supabase?: SupabaseClient | null
): Promise<CustomerWithRollup> {
  const validated = customerInputSchema.parse(input);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: validated.name,
          phone: validated.phone,
          address: validated.address || '',
        })
        .select('*')
        .single();

      if (!error && data) {
        const created: CustomerWithRollup = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          address: data.address || '',
          purchase_count: 0,
          debt_balance: 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        memoryCustomers.push(created);
        return created;
      }
    } catch (err) {
      console.warn('Supabase create customer failed, saving to memory store:', err);
    }
  }

  const newId = 'cust-' + Math.random().toString(36).slice(2, 9);
  const now = new Date().toISOString();
  const created: CustomerWithRollup = {
    id: newId,
    name: validated.name,
    phone: validated.phone,
    address: validated.address || '',
    purchase_count: 0,
    debt_balance: 0,
    created_at: now,
    updated_at: now,
  };
  memoryCustomers.push(created);
  return created;
}

export async function updateCustomer(
  id: string,
  input: CustomerInput,
  supabase?: SupabaseClient | null
): Promise<CustomerWithRollup> {
  const validated = customerInputSchema.parse(input);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: validated.name,
          phone: validated.phone,
          address: validated.address || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        const existing = memoryCustomers.find((c) => c.id === id);
        const updated: CustomerWithRollup = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          address: data.address || '',
          purchase_count: existing?.purchase_count || 0,
          debt_balance: existing?.debt_balance || 0,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        const idx = memoryCustomers.findIndex((c) => c.id === id);
        if (idx >= 0) memoryCustomers[idx] = updated;
        return updated;
      }
    } catch (err) {
      console.warn('Supabase update customer failed, updating memory store:', err);
    }
  }

  const idx = memoryCustomers.findIndex((c) => c.id === id);
  if (idx === -1) {
    throw new Error(`Customer with id ${id} not found`);
  }

  const prev = memoryCustomers[idx];
  const updated: CustomerWithRollup = {
    ...prev,
    name: validated.name,
    phone: validated.phone,
    address: validated.address || '',
    updated_at: new Date().toISOString(),
  };
  memoryCustomers[idx] = updated;
  return updated;
}
