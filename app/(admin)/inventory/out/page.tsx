import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { StockService } from '@/lib/inventory/stock-service';
import { StockForm } from '@/components/inventory/stock-form';

export const metadata: Metadata = {
  title: 'Stock Out | ARLQ Food Condiments Trading',
  description: 'Record stock that left without a sale (damages, giveaways, repacking spills).',
};

async function getSafeSupabaseClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

interface StockOutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StockOutPage({ searchParams }: StockOutPageProps) {
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
    stockService.getRecentMovements('Out', 5),
  ]);

  return (
    <StockForm
      kind="out"
      variants={variants}
      initialVariantId={initialVariantId}
      recentMovements={recentMovements}
    />
  );
}
