import { Metadata } from 'next';
import { getProductsAction } from '@/lib/products/product-actions';
import { ProductTable } from '@/components/products/product-table';

export const metadata: Metadata = {
  title: 'Products | ARLQ Food Condiments Trading',
  description: 'Manage condiment products catalog, SKU tracking, and pricing.',
};

export default async function ProductsPage() {
  const initialProducts = await getProductsAction();

  return <ProductTable initialProducts={initialProducts} />;
}
