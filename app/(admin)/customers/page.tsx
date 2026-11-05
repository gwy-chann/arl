import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Customers | ARLQ Food Condiments Trading',
  description: 'Manage condiment buyers, wholesale accounts, and contact directories.',
};

export default function CustomersPage() {
  return (
    <PlaceholderPage
      title="Customer Directory"
      subtitle="Manage grocery accounts, sari-sari store retailers, restaurant buyers, and bulk distributors."
      icon="users"
      plannedFeatures={[
        {
          title: 'Customer Directory & Profiles',
          description:
            'Store business names, owner contacts, TIN numbers, delivery addresses, and contact phone numbers.',
        },
        {
          title: 'Pricing Tier & Terms Assignment',
          description:
            'Assign custom credit terms (Net 7, Net 15, Net 30, COD) and special wholesale price brackets.',
        },
        {
          title: 'Purchase History & Reorder Cycles',
          description:
            'Review previous order frequency and favorite condiment lines to anticipate repeat restocking.',
        },
        {
          title: 'Route & Delivery Staging',
          description:
            'Group customers by delivery area or delivery route to streamline logistical dispatch.',
        },
      ]}
    />
  );
}
