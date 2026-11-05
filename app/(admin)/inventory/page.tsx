import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Inventory Overview | ARLQ Food Condiments Trading',
  description: 'Monitor stock levels, warehouse batches, and storage locations.',
};

export default function InventoryPage() {
  return (
    <PlaceholderPage
      title="Stock Overview"
      subtitle="Comprehensive warehouse stock level monitoring across all condiment varieties and container sizes."
      icon="box"
      plannedFeatures={[
        {
          title: 'Real-time Stock Levels',
          description:
            'Monitor on-hand inventory balances, reserved orders, and available stock for all toyo, suka, and patis lines.',
        },
        {
          title: 'Batch & Expiry Date Tracking',
          description:
            'Track production batch numbers and expiration dates to enforce first-in, first-out (FIFO) condiment rotation.',
        },
        {
          title: 'Multi-Location Warehousing',
          description:
            'View condiment counts across the main warehouse, storefront staging, and distribution vans.',
        },
        {
          title: 'Automated Stock Valuation',
          description:
            'Compute total current inventory holding valuation based on weighted average unit costs.',
        },
      ]}
    />
  );
}
