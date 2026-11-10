import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getProductByIdAction } from '@/lib/products/product-actions';
import { getCategoriesAction } from '@/lib/categories/category-actions';
import { ProductForm } from '@/components/products/product-form';

export const instant = false;

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const product = await getProductByIdAction(id);

  return {
    title: product
      ? `Edit ${product.name} | ARLQ Food Condiments Trading`
      : 'Edit Product | ARLQ Food Condiments Trading',
    description: 'Update prices and minimum stock for each size.',
  };
}

export default async function EditProductPage({
  params,
}: Readonly<EditProductPageProps>) {
  await connection();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductByIdAction(id),
    getCategoriesAction(),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm initialProduct={product} categories={categories} />;
}
