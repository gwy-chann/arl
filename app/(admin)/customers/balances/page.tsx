import { Metadata } from 'next';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'Customers with Balances | ARLQ Food Condiments Trading',
  description: 'Monitor unpaid customer accounts, aging receivables, and credit limits.',
};

export default function CustomerBalancesPage() {
  return (
    <PlaceholderPage
      title="Customer Balances & Receivables"
      subtitle="Track outstanding trade balances, overdue payments, and credit collections for wholesale accounts."
      icon="users"
      plannedFeatures={[
        {
          title: 'Accounts Receivable Aging',
          description:
            'Group outstanding balances into 0-30 days, 31-60 days, and 60+ days overdue buckets.',
        },
        {
          title: 'Payment Collection Recording',
          description:
            'Log partial payments, issued check details, and official receipts directly against open customer balances.',
        },
        {
          title: 'Credit Limit Enforcement',
          description:
            'Automatically alert staff or block dispatch if a customer reaches their credit ceiling.',
        },
        {
          title: 'Statement of Account (SOA)',
          description:
            'Generate professional PDF statements of account ready to email or print for customers.',
        },
      ]}
    />
  );
}
