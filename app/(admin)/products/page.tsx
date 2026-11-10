import { Metadata } from 'next';
import { connection } from 'next/server';
import { getProductsAction } from '@/lib/products/product-actions';
import { ProductTable } from '@/components/products/product-table';

export const instant = false;

export const metadata: Metadata = {
  title: 'Products | ARLQ Food Condiments Trading',
  description: 'Manage condiment products catalog, SKU tracking, and pricing.',
};

export default async function ProductsPage() {
  await connection();
  const initialProducts = await getProductsAction();

  return <ProductTable initialProducts={initialProducts} />;
}

