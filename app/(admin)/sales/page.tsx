import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SaleService } from '@/lib/sales/sale-service';
import { SalesLedgerTable } from '@/components/sales/sales-ledger-table';

export const metadata: Metadata = {
  title: 'Sales | ARLQ Food Condiments Trading',
  description: 'Browse sales transaction history, itemized receipts, and fulfillment statuses.',
};

export default async function SalesPage() {
  const supabase = await createClient();
  const saleService = new SaleService(supabase);
  const sales = await saleService.getSales();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Sales</h1>
          <p className="text-sm text-text-secondary mt-1">
            All recorded transactions.
          </p>
        </div>
        <div>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-text-light font-semibold rounded-lg hover:bg-primary-hover active:scale-98 transition-all text-sm shadow-xs"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New sale
          </Link>
        </div>
      </div>

      {/* Sales Ledger Table */}
      <SalesLedgerTable sales={sales} />
    </div>
  );
}
