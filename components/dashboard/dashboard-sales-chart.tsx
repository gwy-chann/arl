import React from 'react';
import Link from 'next/link';
import type { SalesChartDayDTO } from '@/lib/dashboard/dashboard-contracts';
import { formatPeso } from '@/lib/dashboard/dashboard-contracts';

export interface DashboardSalesChartProps {
  chart: SalesChartDayDTO[];
}

export function DashboardSalesChart({ chart }: Readonly<DashboardSalesChartProps>) {
  return (
    <section className="card" aria-label="Sales visualizer, last 7 days">
      <div className="card-h">
        <h2>Sales, last 7 days</h2>
        <Link
          href="/reports"
          className="text-primary hover:underline text-sm font-semibold transition-colors"
        >
          Full report
        </Link>
      </div>

      <div className="card-b">
        <div className="bars" role="img" aria-label="7-day sales bar chart">
          {chart.map((bar) => {
            const barClass = `bar ${bar.is_today ? 'cur' : ''}`;
            const revenueDisplay = bar.revenue > 0 ? formatPeso(bar.revenue) : '';
            const tooltipTitle = `${bar.day_label}: ${formatPeso(bar.revenue, true)}`;

            return (
              <div key={bar.day_offset} className={barClass} title={tooltipTitle}>
                <em>{revenueDisplay}</em>
                <i
                  style={{ height: `${bar.height_percentage}%` }}
                  aria-valuenow={bar.revenue}
                  aria-valuemin={0}
                />
                <span>{bar.day_label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
