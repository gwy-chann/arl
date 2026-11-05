import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Stock In | ARLQ Food Condiments Trading',
  description: 'Log incoming stock deliveries and production batches.',
};

export default function StockInPage() {
  return (
    <PlaceholderPage
      title="Stock In Operations"
      subtitle="Log incoming condiment batches from bottling facilities, supplier deliveries, and supplier returns."
      icon="box"
      plannedFeatures={[
        {
          title: 'Delivery Receipt Logging',
          description:
            'Receive shipments against purchase orders with supplier DR number, truck plate, and receiving staff sign-off.',
        },
        {
          title: 'Quality Inspection Checklist',
          description:
            'Verify bottle seals, cap integrity, and liquid clarity before committing items to active inventory.',
        },
        {
          title: 'Cost per Unit Updates',
          description:
            'Record purchase costs and freight surcharges to update inventory cost bases automatically.',
        },
        {
          title: 'Immediate Stock Sync',
          description:
            'Increase available inventory counts immediately across POS and sales order entry screens.',
        },
      ]}
    />
  );
}
