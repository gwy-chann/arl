import { Metadata } from 'next';
import { connection } from 'next/server';
import { getProductsAction } from '@/lib/products/product-actions';
import { getCategoriesAction } from '@/lib/categories/category-actions';
import { ProductTable } from '@/components/products/product-table';

export const instant = false;

export const metadata: Metadata = {
  title: 'Products | ARLQ Food Condiments Trading',
  description: 'Manage condiment products catalog, SKU tracking, and pricing.',
};

export default async function ProductsPage() {
  await connection();
  const [initialProducts, initialCategories] = await Promise.all([
    getProductsAction(),
    getCategoriesAction(),
  ]);

  const treeKey =
    initialProducts.map((p) => `${p.id}:${p.updated_at}`).join('|') +
    `:${initialCategories.length}`;

  return (
    <ProductTable
      key={treeKey}
      initialProducts={initialProducts}
      initialCategories={initialCategories}
    />
  );
}

