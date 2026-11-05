import { Metadata } from 'next';
import Link from 'next/link';
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

export default async function NewSalePage({ searchParams }: NewSalePageProps) {
  const params = await searchParams;
  const initialCustomerId = params.customerId || params.customer || '';

  const supabase = await getSafeSupabaseClient();
  const [customers, products] = await Promise.all([
    getCustomerDirectory(supabase),
    new ProductService(supabase).getProducts(),
  ]);

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

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          New sale
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          Pick the customer and items. Prices, totals and profit fill in for you.
        </p>
      </div>

      {/* POS Checkout Wizard */}
      <NewSaleWizard
        customers={customers}
        products={products}
        initialCustomerId={initialCustomerId}
      />
    </div>
  );
}
