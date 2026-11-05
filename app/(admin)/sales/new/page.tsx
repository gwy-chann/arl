import { Metadata } from 'next';
import { getCustomerDirectory } from '@/lib/customers/customer-service';
import { NewSaleCustomerSelector } from '@/components/sales/new-sale-customer-selector';
import { PlaceholderPage } from '@/components/ui/placeholder-page';

export const metadata: Metadata = {
  title: 'New Sale | ARLQ Food Condiments Trading',
  description: 'Create and process a new customer sale order.',
};

interface NewSalePageProps {
  searchParams: Promise<{ customerId?: string; customer?: string }>;
}

export default async function NewSalePage({ searchParams }: NewSalePageProps) {
  const params = await searchParams;
  const initialCustomerId = params.customerId || params.customer || '';
  const customers = await getCustomerDirectory();

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          New sale
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          Pick the customer and items. Prices, totals and profit fill in for you.
        </p>
      </div>

      {/* Customer Pre-Selection Card (Fulfills ARL-10 Scenario 3) */}
      <NewSaleCustomerSelector
        customers={customers}
        initialCustomerId={initialCustomerId}
      />

      {/* Sale Order Lines & Checkout Stepper Placeholder */}
      <PlaceholderPage
        title="Items & Checkout Details"
        subtitle="The item selector, quantity stepper, and receipt calculation wizard are scheduled for STORY-2.5 (ARL-14)."
        icon="cart"
        plannedFeatures={[
          {
            title: 'Multi-Variant Condiment Line Items',
            description:
              'Select vinegar (suka), soy sauce (toyo), or fish sauce (patis) across 350ml, 1L, or 1gal packaging sizes.',
          },
          {
            title: 'Live Profit Margin Calculation',
            description:
              'Automatically computes revenue, wholesale cost of goods sold, and gross profit in real time.',
          },
          {
            title: 'Instant Debt & Credit Balance Warning',
            description:
              'Flags existing unpaid customer utang directly in checkout before approving partial payment credit.',
          },
          {
            title: 'Printable Sales Receipt Slip',
            description:
              'Instantly produces a print-formatted receipt slip with delivery status and payment terms upon confirmation.',
          },
        ]}
      />
    </div>
  );
}
