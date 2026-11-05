import { Metadata } from 'next';
import { connection } from 'next/server';
import { getSafeSupabaseClient } from '@/lib/supabase/server';
import { ProductService } from '@/lib/products/product-service';
import { InventoryReportView } from '@/components/reports/inventory-report-view';

export const metadata: Metadata = {
  title: 'Inventory Valuation Report · ARLQ',
  description: 'Warehouse inventory valuation breakdown comparing cost basis versus retail selling price.',
};

export default async function InventoryReportPage() {
  await connection();
  const supabase = await getSafeSupabaseClient();

  const productService = new ProductService(supabase);
  const productsWithVariants = await productService.getProducts();

  const products = productsWithVariants.map((p) => ({ id: p.id, name: p.name }));
  const variants = productsWithVariants.flatMap((p) =>
    (p.variants || []).map((v) => ({
      id: v.id,
      product_id: p.id,
      size: v.size,
      cost_price: Number(v.cost_price),
      selling_price: Number(v.selling_price),
      stock_quantity: Number(v.stock_quantity),
      min_stock_level: Number(v.min_stock_level),
    }))
  );

  return <InventoryReportView products={products} variants={variants} />;
}
