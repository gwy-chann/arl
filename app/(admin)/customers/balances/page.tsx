import { Metadata } from 'next';
import { connection } from 'next/server';
import { getCustomerUtangSummaryAction } from '@/lib/customers/customer-actions';
import { CustomerUtangTracker } from '@/components/customers/customer-utang-tracker';

export const instant = false;

export const metadata: Metadata = {
  title: 'Customers with Balances (Utang) | ARLQ Food Condiments Trading',
  description:
    'Monitor customer credit balances in a dedicated utang center sorted by age of debt with overdue badges.',
};

export default async function CustomerBalancesPage() {
  await connection();
  const summary = await getCustomerUtangSummaryAction();

  return <CustomerUtangTracker initialSummary={summary} />;
}
