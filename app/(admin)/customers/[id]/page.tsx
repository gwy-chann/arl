import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCustomerByIdAction } from '@/lib/customers/customer-actions';
import { CustomerProfile } from '@/components/customers/customer-profile';

interface CustomerProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CustomerProfilePageProps): Promise<Metadata> {
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
  const { id } = await params;
  const customer = await getCustomerByIdAction(id);

  if (!customer) {
    notFound();
  }

  return <CustomerProfile customer={customer} />;
}
