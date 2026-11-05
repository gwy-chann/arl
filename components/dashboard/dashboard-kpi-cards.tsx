import React from 'react';
import type { DashboardKpiDTO } from '@/lib/dashboard/dashboard-contracts';
import { formatPeso } from '@/lib/dashboard/dashboard-contracts';

export interface DashboardKpiCardsProps {
  kpis: DashboardKpiDTO;
}

export function DashboardKpiCards({ kpis }: Readonly<DashboardKpiCardsProps>) {
  const isDebtAlert = kpis.outstanding_balances > 0;
  const isStockAlert = kpis.low_stock_count > 0;

  return (
    <div className="stats" role="region" aria-label="Executive KPI Overview">
      {/* 1. Sales Today */}
      <div className="stat">
        <span>Sales today</span>
        <b>{formatPeso(kpis.sales_today)}</b>
        <small>{kpis.transactions_today} transactions</small>
      </div>

      {/* 2. Sales This Month */}
      <div className="stat">
        <span>Sales this month</span>
        <b>{formatPeso(kpis.sales_this_month)}</b>
        <small>Profit {formatPeso(kpis.profit_this_month)}</small>
      </div>

      {/* 3. Outstanding Balances */}
      <div className={`stat ${isDebtAlert ? 'alert' : ''}`}>
        <span>Outstanding balances</span>
        <b>{formatPeso(kpis.outstanding_balances)}</b>
        <small>{kpis.unpaid_sales_count} unpaid sales</small>
      </div>

      {/* 4. Low Stock Items */}
      <div className={`stat ${isStockAlert ? 'alert' : ''}`}>
        <span>Low stock items</span>
        <b>
          {kpis.low_stock_count} of {kpis.total_variants_count}
        </b>
        <small>at or below minimum</small>
      </div>
    </div>
  );
}
