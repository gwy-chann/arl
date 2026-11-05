import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Movement History | ARLQ Food Condiments Trading',
  description: 'Audit log of all stock ins, stock outs, adjustments, and returns.',
};

export default function InventoryHistoryPage() {
  return (
    <PlaceholderPage
      title="Movement History"
      subtitle="Complete chronological audit trail for every inbound and outbound condiment transaction."
      icon="box"
      plannedFeatures={[
        {
          title: 'Chronological Audit Log',
          description:
            'Inspect exact timestamps, quantities changed, before-and-after balances, and user attribution.',
        },
        {
          title: 'Advanced Filter & Date Range',
          description:
            'Filter by condiment type (toyo, suka, patis), movement type (sale, receive, discard), or staff member.',
        },
        {
          title: 'CSV & Excel Export',
          description:
            'Export filtered inventory transaction ledgers for monthly accountant reconciliation.',
        },
        {
          title: 'Discrepancy Investigation',
          description:
            'Drill down into individual transactions to review attached receipt numbers and operator notes.',
        },
      ]}
    />
  );
}
