import Link from 'next/link';
import { ReportTabs } from '@/components/reports/report-tabs';

export const metadata = {
  title: 'Reports · ARLQ',
  description: 'Multi-dimensional analytical reports covering sales, inventory valuation, movement, low stock, balances, and profit margins.',
};

export default function ReportsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="max-w-5xl">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-4 border-b border-border gap-4 no-print">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-muted mb-1.5">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-text-primary font-semibold">Reports</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            Reports
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Filter by product and size, then print or export.
          </p>
        </div>

        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-md bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors cursor-pointer shadow-xs"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Persistent Tabs Navigation */}
      <ReportTabs />

      {/* Active Tab Page Content */}
      {children}
    </div>
  );
}
