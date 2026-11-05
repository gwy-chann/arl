import { Metadata } from 'next';
import { CustomerForm } from '@/components/customers/customer-form';

export const metadata: Metadata = {
  title: 'Add Customer | ARLQ Food Condiments Trading',
  description: 'Register a new customer or business account.',
};

export default function NewCustomerPage() {
  return <CustomerForm mode="create" />;
}
