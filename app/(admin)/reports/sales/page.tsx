import { Metadata } from 'next';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProductService } from '@/lib/products/product-service';
import { SaleService } from '@/lib/sales/sale-service';
import { SalesReportView } from '@/components/reports/sales-report-view';

export const metadata: Metadata = {
  title: 'Sales Report · ARLQ',
  description: 'Itemized and aggregate sales report across daily, weekly, and monthly periods.',
};

export default async function SalesReportPage() {
  await connection();
  const supabase = await createClient();

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

  const saleService = new SaleService(supabase);
  const sales = await saleService.getSales();

  return <SalesReportView products={products} variants={variants} sales={sales} />;
}
