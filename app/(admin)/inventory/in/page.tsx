import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { StockService } from '@/lib/inventory/stock-service';
import { StockForm } from '@/components/inventory/stock-form';

export const metadata: Metadata = {
  title: 'Stock In | ARLQ Food Condiments Trading',
  description: 'Record stock that arrived from warehouse deliveries or customer returns.',
};

async function getSafeSupabaseClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

interface StockInPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StockInPage({ searchParams }: StockInPageProps) {
  const params = await searchParams;
  const initialVariantId =
    typeof params.v === 'string'
      ? params.v
      : typeof params.variantId === 'string'
      ? params.variantId
      : undefined;

  const supabase = await getSafeSupabaseClient();
  const stockService = new StockService(supabase);

  const [variants, recentMovements] = await Promise.all([
    stockService.listVariantsForStock(),
    stockService.getRecentMovements('In', 5),
  ]);

  return (
    <StockForm
      kind="in"
      variants={variants}
      initialVariantId={initialVariantId}
      recentMovements={recentMovements}
    />
  );
}
