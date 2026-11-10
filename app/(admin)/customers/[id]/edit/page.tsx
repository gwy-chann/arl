import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getCustomerByIdAction } from '@/lib/customers/customer-actions';
import { CustomerForm } from '@/components/customers/customer-form';

export const instant = false;

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditCustomerPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const customer = await getCustomerByIdAction(id);

  if (!customer) {
    return {
      title: 'Customer Not Found | ARLQ',
    };
  }

  return {
    title: `Edit ${customer.name} | Customers | ARLQ`,
    description: `Update customer details for ${customer.name}.`,
  };
}

export default async function EditCustomerPage({
  params,
}: Readonly<EditCustomerPageProps>) {
  await connection();
  const { id } = await params;
  const customer = await getCustomerByIdAction(id);

  if (!customer) {
    notFound();
  }

  return <CustomerForm initialCustomer={customer} mode="edit" />;
}
