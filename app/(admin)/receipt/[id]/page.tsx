import { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SaleService } from '@/lib/sales/sale-service';
import { toReceiptSnapshot } from '@/lib/receipt/receipt-service';
import { ReceiptView } from '@/components/receipt/receipt-view';
import { ReceiptPrintButton } from '@/components/receipt/receipt-print-button';

export const instant = false;

export const metadata: Metadata = {
  title: 'Receipt Preview | ARLQ Food Condiments Trading',
  description: 'Printable official sales receipt with 58mm/80mm POS thermal print layout.',
};

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: Readonly<ReceiptPageProps>) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const saleService = new SaleService(supabase);

  const sale = await saleService.getSaleById(id);

  if (!sale) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Receipt not found</h1>
            <p className="text-sm text-text-secondary mt-1">
              The requested sales transaction could not be located.
            </p>
          </div>
          <Link
            href="/sales"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-bg-surface border border-border text-text-primary hover:bg-bg-hover transition-colors shadow-xs"
          >
            Back to sales
          </Link>
        </div>
      </div>
    );
  }

  const receipt = toReceiptSnapshot(sale);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/sales" className="hover:text-text-primary transition-colors">
          Sales
        </Link>
        <span>/</span>
        <Link href={`/sales/${sale.id}`} className="hover:text-text-primary transition-colors">
          {sale.receipt_number}
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">Receipt</span>
      </nav>

      {/* Page Header */}
      <div className="page-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Receipt preview</h1>
          <p className="text-sm text-text-secondary mt-1">Review and print.</p>
        </div>
        <div className="flex items-center gap-3">
          <ReceiptPrintButton />
          <Link
            href={`/sales/${sale.id}`}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-bg-surface border border-border text-text-primary hover:bg-bg-hover active:scale-98 transition-all shadow-xs"
          >
            Back to sale
          </Link>
        </div>
      </div>

      {/* Monospace Thermal Receipt Card */}
      <ReceiptView receipt={receipt} />
    </div>
  );
}
