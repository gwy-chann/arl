import { Metadata } from 'next';
import { connection } from 'next/server';
import { getCustomersAction } from '@/lib/customers/customer-actions';
import { CustomerTable } from '@/components/customers/customer-table';

export const instant = false;

export const metadata: Metadata = {
  title: 'Customers | ARLQ Food Condiments Trading',
  description: 'Manage condiment buyers, wholesale accounts, and contact directories.',
};

export default async function CustomersPage() {
  await connection();
  const initialCustomers = await getCustomersAction();

  return <CustomerTable initialCustomers={initialCustomers} />;
}
