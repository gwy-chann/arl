import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Low Stock Alerts | ARLQ Food Condiments Trading',
  description: 'View critical inventory items and reorder thresholds.',
};

export default function LowStockPage() {
  return (
    <PlaceholderPage
      title="Low Stock Alerts"
      subtitle="Early-warning system to identify fast-depleting condiment stock and prevent fulfillment bottlenecks."
      icon="box"
      plannedFeatures={[
        {
          title: 'Custom Safety Reorder Points',
          description:
            'Set custom minimum stock thresholds per SKU (e.g., minimum 50 crates of toyo, 30 gallons of vinegar).',
        },
        {
          title: 'Urgent Replenishment Warnings',
          description:
            'Color-coded criticality badges (Critical, Low, Warning) based on current depletion velocity.',
        },
        {
          title: 'One-Click Reorder Drafts',
          description:
            'Auto-generate purchase order drafts pre-filled with supplier details and recommended order quantities.',
        },
        {
          title: 'Email & In-App Notifications',
          description:
            'Send daily digest alerts to inventory supervisors when items hit the safety threshold.',
        },
      ]}
    />
  );
}
