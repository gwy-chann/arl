import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStockMinimumsMatrix } from '@/lib/settings/settings-service';
import { StockMinimumsForm } from '@/components/settings/stock-minimums-form';

export const instant = false;

export const metadata = {
  title: 'Minimum Stock Levels · Settings · ARLQ',
  description: 'Manage low stock alert thresholds across all product sizes and variants',
};

export default async function StockSettingsPage() {
  await connection();

  let supabase = null;
  try {
    supabase = await createClient();
  } catch {
    supabase = null;
  }

  const matrix = await getStockMinimumsMatrix(supabase ?? undefined);

  return <StockMinimumsForm initialMatrix={matrix} />;
}
