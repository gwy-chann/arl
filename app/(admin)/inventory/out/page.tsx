import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Stock Out | ARLQ Food Condiments Trading',
  description: 'Log outgoing condiment shipments, transfers, and disposals.',
};

export default function StockOutPage() {
  return (
    <PlaceholderPage
      title="Stock Out Operations"
      subtitle="Record stock departures for order fulfillment, warehouse transfers, spillages, and expired write-offs."
      icon="box"
      plannedFeatures={[
        {
          title: 'Order Fulfillment Dispatch',
          description:
            'Pick, pack, and release items for scheduled delivery routes with verified packing slips.',
        },
        {
          title: 'Damages & Spillage Recording',
          description:
            'Log broken bottles, container leaks, and quality discard reasons for shrink analysis.',
        },
        {
          title: 'Inter-Branch Stock Transfers',
          description:
            'Transfer gallons and drums between secondary fulfillment depots with transit confirmation.',
        },
        {
          title: 'Reason-Coded Audit Trail',
          description:
            'Enforce mandatory selection of stock deduction reason codes for accurate cost accounting.',
        },
      ]}
    />
  );
}
