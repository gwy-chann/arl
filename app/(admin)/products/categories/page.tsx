import { Metadata } from 'next';
import { connection } from 'next/server';
import { getCategoriesAction } from '@/lib/categories/category-actions';
import { CategoryManager } from '@/components/categories/category-manager';

export const instant = false;

export const metadata: Metadata = {
  title: 'Categories | ARLQ Food Condiments Trading',
  description: 'Group products so they are easier to find in the ARLQ inventory system.',
};

export default async function CategoriesPage() {
  await connection();
  const initialCategories = await getCategoriesAction();

  return <CategoryManager initialCategories={initialCategories} />;
}


