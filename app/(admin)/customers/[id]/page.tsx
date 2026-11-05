import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getCustomerByIdAction } from '@/lib/customers/customer-actions';
import { CustomerProfile } from '@/components/customers/customer-profile';

export const instant = false;

interface CustomerProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CustomerProfilePageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const customer = await getCustomerByIdAction(id);

  if (!customer) {
    return {
      title: 'Customer Not Found | ARLQ',
    };
  }

  return {
    title: `${customer.name} | Customers | ARLQ`,
    description: `Customer details and transactions for ${customer.name}.`,
  };
}

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  await connection();
  const { id } = await params;
  const customer = await getCustomerByIdAction(id);

  if (!customer) {
    notFound();
  }

  return <CustomerProfile customer={customer} />;
}
