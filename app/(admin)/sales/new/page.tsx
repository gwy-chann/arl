import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'New Sale | ARLQ Food Condiments Trading',
  description: 'Create and process a new customer sale order.',
};

export default function NewSalePage() {
  return (
    <PlaceholderPage
      title="New Sale Order"
      subtitle="The point-of-sale checkout flow for recording new condiment orders is coming soon."
      icon="cart"
      plannedFeatures={[
        {
          title: 'Customer Selector & Credit Check',
          description:
            'Quickly lookup existing customer profiles, verify available credit limits, or register new buyers on the fly.',
        },
        {
          title: 'Quick Item Search & Barcode Scan',
          description:
            'Instantly search by condiment name, container size, or scan product barcodes for rapid cart population.',
        },
        {
          title: 'Automatic Discounts & Surcharges',
          description:
            'Apply wholesale volume discounts and custom distributor agreements automatically upon checkout.',
        },
        {
          title: 'Receipt & Delivery Note Printing',
          description:
            'Generate printable delivery notes and thermal receipt slips immediately upon confirming the order.',
        },
      ]}
    />
  );
}
