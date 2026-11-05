import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { StockService } from '@/lib/inventory/stock-service';
import { MovementTable } from '@/components/inventory/movement-table';

export const metadata: Metadata = {
  title: 'Movement History | ARLQ Food Condiments Trading',
  description: 'Chronological audit ledger of all stock ins, stock outs, and sale deductions.',
};

async function getSafeSupabaseClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

export default async function InventoryHistoryPage() {
  const supabase = await getSafeSupabaseClient();
  const stockService = new StockService(supabase);
  const movements = await stockService.listMovements();

  return <MovementTable initialMovements={movements} />;
}
