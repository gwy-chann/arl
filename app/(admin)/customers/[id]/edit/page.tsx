import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCustomerByIdAction } from '@/lib/customers/customer-actions';
import { CustomerForm } from '@/components/customers/customer-form';

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditCustomerPageProps): Promise<Metadata> {
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
}: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomerByIdAction(id);

  if (!customer) {
    notFound();
  }

  return <CustomerForm initialCustomer={customer} mode="edit" />;
}
