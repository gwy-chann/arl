import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Reports & Analytics | ARLQ Food Condiments Trading',
  description: 'Business insights, sales charts, and inventory analytics.',
};

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports & Analytics"
      subtitle="Executive summaries and operational analytics covering revenue, volume velocity, and inventory turnover."
      icon="chart"
      plannedFeatures={[
        {
          title: 'Sales & Revenue Analytics',
          description:
            'Interactive charts breaking down gross sales, net revenue, and discount volume by month and week.',
        },
        {
          title: 'Top-Selling Condiment Rankings',
          description:
            'Identify bestsellers across soy sauce, vinegar, and fish sauce lines and determine peak seasonal demand.',
        },
        {
          title: 'Inventory Turnover Rates',
          description:
            'Evaluate stock days-on-hand to spot slow-moving sizes and optimize batch replenishment cadences.',
        },
        {
          title: 'Exportable Financial Statements',
          description:
            'One-click export of monthly transaction ledgers, VAT summaries, and gross profit margins.',
        },
      ]}
    />
  );
}
