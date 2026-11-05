import { Metadata } from 'next';
import { getCategoriesAction } from '@/lib/categories/category-actions';
import { ProductForm } from '@/components/products/product-form';

export const metadata: Metadata = {
  title: 'Add Product | ARLQ Food Condiments Trading',
  description: 'Set the product and the price of each size.',
};

export default async function NewProductPage() {
  const categories = await getCategoriesAction();

  return <ProductForm categories={categories} />;
}
