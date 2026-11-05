import { Metadata } from 'next';
import { connection } from 'next/server';
import { getSafeSupabaseClient } from '@/lib/supabase/server';
import { ProductService } from '@/lib/products/product-service';
import { StockService } from '@/lib/inventory/stock-service';
import { MovementReportView } from '@/components/reports/movement-report-view';
import type { StockMovementReference } from '@/lib/reports/report-service';

export const metadata: Metadata = {
  title: 'Stock Movement Report · ARLQ',
  description: 'Inbound and outbound condiment inventory velocity across flexible reporting ranges.',
};

export default async function MovementReportPage() {
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

  const stockService = new StockService(supabase);
  const rawMovements = await stockService.listMovements();

  const movements: StockMovementReference[] = rawMovements.map((m) => ({
    id: m.id,
    variant_id: m.variant_id,
    movement_type: m.movement_type as 'In' | 'Out' | 'Sale',
    quantity: m.quantity,
    created_at: m.created_at,
  }));

  return <MovementReportView products={products} variants={variants} movements={movements} />;
}
