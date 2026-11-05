import { Metadata } from 'next';
import { connection } from 'next/server';
import { getSafeSupabaseClient } from '@/lib/supabase/server';
import { ProductService } from '@/lib/products/product-service';
import { SaleService } from '@/lib/sales/sale-service';
import { ProfitReportView } from '@/components/reports/profit-report-view';

export const metadata: Metadata = {
  title: 'Earnings & Profit Report · ARLQ',
  description: 'Gross profit margins and earnings analysis across condiment product variants.',
};

export default async function ProfitReportPage() {
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

  const saleService = new SaleService(supabase);
  const sales = await saleService.getSales();

  return <ProfitReportView products={products} variants={variants} sales={sales} />;
}
