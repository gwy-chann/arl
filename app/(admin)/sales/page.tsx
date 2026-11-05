import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Sales | ARLQ Food Condiments Trading',
  description: 'Track orders, invoices, and sales transactions.',
};

export default function SalesPage() {
  return (
    <PlaceholderPage
      title="Sales Management"
      subtitle="View, filter, and manage sales orders, receipts, and payment statuses for condiment buyers."
      icon="cart"
      plannedFeatures={[
        {
          title: 'Sales Orders & Invoicing',
          description:
            'Generate official receipts, delivery receipts, and invoices for wholesale and retail customers.',
        },
        {
          title: 'Payment Status Tracking',
          description:
            'Track cash on delivery, bank transfers, check deposits, and partial credit payment terms.',
        },
        {
          title: 'Daily Sales Reconciliation',
          description:
            'Review end-of-day sales totals, item breakdown, and cash collections at a glance.',
        },
        {
          title: 'Fast Checkout Counter',
          description:
            'Quickly add line items, apply customer pricing tiers, and compute sales taxes automatically.',
        },
      ]}
    />
  );
}
