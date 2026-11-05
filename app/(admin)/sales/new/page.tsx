import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCustomerDirectory } from '@/lib/customers/customer-service';
import { ProductService } from '@/lib/products/product-service';
import { NewSaleWizard } from '@/components/sales/new-sale-wizard';

export const metadata: Metadata = {
  title: 'New Sale | ARLQ Food Condiments Trading',
  description: 'Create and process a new customer sale order.',
};

async function getSafeSupabaseClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

interface NewSalePageProps {
  searchParams: Promise<{ customerId?: string; customer?: string }>;
}

function NewSaleLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
      <div className="flex flex-col gap-5">
        <div className="bg-bg-surface border border-border rounded-[var(--r)] p-5 animate-pulse">
          <div className="h-4 bg-bg-muted rounded w-28 mb-3" />
          <div className="h-10 bg-bg-muted rounded w-full max-w-md" />
        </div>
        <div className="bg-bg-surface border border-border rounded-[var(--r)] p-5 animate-pulse">
          <div className="h-5 bg-bg-muted rounded w-20 mb-4" />
          <div className="h-24 bg-bg-muted rounded w-full" />
        </div>
      </div>
      <div className="bg-bg-surface border border-border rounded-[var(--r)] p-5 animate-pulse">
        <div className="h-5 bg-bg-muted rounded w-24 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-bg-muted rounded w-full" />
          <div className="h-4 bg-bg-muted rounded w-full" />
          <div className="h-10 bg-bg-muted rounded w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

async function NewSaleContent({ searchParams }: NewSalePageProps) {
  const params = await searchParams;
  const initialCustomerId = params.customerId || params.customer || '';

  const supabase = await getSafeSupabaseClient();
  const [customers, products] = await Promise.all([
    getCustomerDirectory(supabase),
    new ProductService(supabase).getProducts(),
  ]);

  return (
    <NewSaleWizard
      customers={customers}
      products={products}
      initialCustomerId={initialCustomerId}
    />
  );
}

export default function NewSalePage({ searchParams }: NewSalePageProps) {
  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-3 text-[13.5px] text-text-muted flex items-center gap-1.5">
        <Link href="/sales" className="hover:text-text-primary transition-colors">
          Sales
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">New sale</span>
      </nav>

      {/* Page Header (Rendered Instantly as Static Shell) */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          New sale
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          Pick the customer and items. Prices, totals and profit fill in for you.
        </p>
      </div>

      {/* Streamed POS Checkout Wizard inside Suspense Boundary */}
      <Suspense fallback={<NewSaleLoadingSkeleton />}>
        <NewSaleContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
