import { Metadata } from 'next';
import { connection } from 'next/server';
import { getInventoryVariantsAction } from '@/lib/inventory/inventory-actions';
import { LowStockTable } from '@/components/inventory/low-stock-table';

export const instant = false;

export const metadata: Metadata = {
  title: 'Low Stock Alerts | ARLQ Food Condiments Trading',
  description: 'Variants at or below the minimum stock threshold with shortage counts.',
};

export default async function LowStockPage() {
  await connection();
  const initialVariants = await getInventoryVariantsAction();

  return <LowStockTable initialVariants={initialVariants} />;
}
