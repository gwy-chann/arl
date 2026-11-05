import { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { getSafeSupabaseClient } from '@/lib/supabase/server';
import { SaleService } from '@/lib/sales/sale-service';
import { getSystemSettings } from '@/lib/settings/settings-service';
import { formatPeso } from '@/lib/customers/customer-service';
import { OverdueAlertBanner } from '@/components/sales/overdue-alert-banner';
import { SalePaymentManager } from '@/components/sales/sale-payment-manager';
import { SaleOrderManager } from '@/components/sales/sale-order-manager';

export const instant = false;

export const metadata: Metadata = {
  title: 'Sale Detail | ARLQ Food Condiments Trading',
  description: 'View itemized sale receipt, customer details, and update payment or delivery statuses.',
};

function formatSaleDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function formatSizeLabel(size?: string): string {
  if (size === '350') return '350 ml';
  if (size === '1L') return '1 L';
  if (size === 'gal') return '1 gal';
  return size || '';
}

interface SaleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: Readonly<SaleDetailPageProps>) {
  await connection();
  const { id } = await params;
  const supabase = await getSafeSupabaseClient();
  const saleService = new SaleService(supabase);

  const [sale, settings] = await Promise.all([
    saleService.getSaleById(id),
    getSystemSettings(supabase),
  ]);

  if (!sale) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Sale not found</h1>
            <p className="text-sm text-text-secondary mt-1">
              The requested sales transaction does not exist or may have been removed.
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

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/sales" className="hover:text-text-primary transition-colors">
          Sales
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{sale.receipt_number}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{sale.receipt_number}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {formatSaleDate(sale.created_at)} · {sale.customer_name}
          </p>
        </div>
        <div>
          <Link
            href={`/receipt/${sale.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-bg-surface border border-border text-text-primary hover:bg-bg-hover active:scale-98 transition-all shadow-xs"
          >
            <svg
              className="w-4 h-4 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print receipt
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Items & Customer) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Alert Banner */}
          {sale.is_overdue && (
            <OverdueAlertBanner
              daysOverdue={sale.days_overdue || 0}
              daysUnpaid={sale.days_unpaid || 0}
              adminMobile={settings.admin_mobile}
            />
          )}

          {/* Items Section */}
          <section className="card bg-bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="card-h p-4 border-b border-border bg-bg-surface">
              <h2 className="text-base font-semibold text-text-primary">Items</h2>
            </div>
            <div className="tbl-wrap overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-bg-muted/50 text-text-muted font-medium">
                    <th scope="col" className="py-3 px-4">Product</th>
                    <th scope="col" className="py-3 px-4 text-right">Qty</th>
                    <th scope="col" className="py-3 px-4 text-right">Unit price</th>
                    <th scope="col" className="py-3 px-4 text-right">Amount</th>
                    <th scope="col" className="py-3 px-4 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sale.items.map((item) => {
                    const lineAmount = item.quantity * item.unit_price;
                    const lineProfit = item.quantity * (item.unit_price - item.unit_cost);
                    const displayName = item.product_name
                      ? `${item.product_name} - ${formatSizeLabel(item.size)}`
                      : `Condiment - ${formatSizeLabel(item.size)}`;

                    return (
                      <tr key={item.id} className="hover:bg-bg-hover transition-colors">
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {displayName}
                        </td>
                        <td className="py-3 px-4 text-right text-text-primary">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-text-primary">
                          {formatPeso(item.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-text-primary">
                          {formatPeso(lineAmount)}
                        </td>
                        <td className="py-3 px-4 text-right text-text-muted">
                          {formatPeso(lineProfit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-bg-muted/40 font-semibold text-text-primary">
                    <td colSpan={3} className="py-3 px-4">Total</td>
                    <td className="py-3 px-4 text-right font-bold text-primary">
                      {formatPeso(sale.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-text-muted">
                      {formatPeso(sale.gross_profit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Customer Details Card */}
          <section className="card bg-bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="card-h p-4 border-b border-border bg-bg-surface">
              <h2 className="text-base font-semibold text-text-primary">Customer Details</h2>
            </div>
            <div className="card-b p-4">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">Customer</dt>
                  <dd className="mt-1 font-medium">
                    <Link
                      href={`/customers/${sale.customer_id}`}
                      className="text-primary hover:underline font-semibold"
                    >
                      {sale.customer_name}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">Contact</dt>
                  <dd className="mt-1 text-text-primary">
                    {sale.customer_phone || 'None provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">Address</dt>
                  <dd className="mt-1 text-text-primary">
                    {sale.customer_address || 'None provided'}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        {/* Right Column (Status Managers) */}
        <aside className="space-y-6">
          <SalePaymentManager
            saleId={sale.id}
            totalAmount={sale.total_amount}
            initialAmountPaid={sale.amount_paid}
            initialPaymentStatus={sale.payment_status}
            initialBalance={sale.balance}
          />

          <SaleOrderManager
            saleId={sale.id}
            initialOrderStatus={sale.order_status}
          />
        </aside>
      </div>
    </div>
  );
}
