import { Metadata } from 'next';
import { connection } from 'next/server';
import { getSafeSupabaseClient } from '@/lib/supabase/server';
import { getCustomerDirectory } from '@/lib/customers/customer-service';
import { SaleService } from '@/lib/sales/sale-service';
import { BalancesReportView } from '@/components/reports/balances-report-view';

export const instant = false;

export const metadata: Metadata = {
  title: 'Customer Balances Report · ARLQ',
  description: 'Auditing outstanding customer debts and unpaid condiment order balances.',
};

export default async function BalancesReportPage() {
  await connection();
  const supabase = await getSafeSupabaseClient();

  const customers = await getCustomerDirectory(supabase);
  const saleService = new SaleService(supabase);
  const sales = await saleService.getSales();

  const customerRefs = customers.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return <BalancesReportView customers={customerRefs} sales={sales} />;
}
