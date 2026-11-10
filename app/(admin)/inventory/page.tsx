import { Metadata } from 'next';
import { connection } from 'next/server';
import { getInventoryVariantsAction } from '@/lib/inventory/inventory-actions';
import { InventoryTable } from '@/components/inventory/inventory-table';

export const instant = false;

export const metadata: Metadata = {
  title: 'Inventory Overview | ARLQ Food Condiments Trading',
  description: 'Live stock monitoring across all nine condiment variants with visual capacity meters.',
};

export default async function InventoryPage() {
  await connection();
  const initialVariants = await getInventoryVariantsAction();

  return <InventoryTable initialVariants={initialVariants} />;
}
