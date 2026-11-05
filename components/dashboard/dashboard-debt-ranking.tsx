import React from 'react';
import Link from 'next/link';
import type { CustomerDebtRankingDTO } from '@/lib/dashboard/dashboard-contracts';
import { formatPeso } from '@/lib/dashboard/dashboard-contracts';

export interface DashboardDebtRankingProps {
  ranking: CustomerDebtRankingDTO[];
}

export function DashboardDebtRanking({
  ranking,
}: Readonly<DashboardDebtRankingProps>) {
  return (
    <section className="card" aria-label="Customer Utang Summary">
      <div className="card-h">
        <h2>Who owes you</h2>
        <Link
          href="/customers/balances"
          className="text-primary hover:underline text-sm font-semibold transition-colors"
        >
          See all
        </Link>
      </div>

      {ranking.length === 0 ? (
        <div className="empty">
          <b>No balances</b>
          <p>Everyone has paid.</p>
        </div>
      ) : (
        <div className="rowlist">
          {ranking.map((r) => (
            <Link
              key={r.customer_id}
              href={`/customers/${r.customer_id}`}
              className="r group"
            >
              <div>
                <b className="group-hover:text-primary transition-colors">
                  {r.customer_name}
                </b>
                <small>Oldest unpaid: {r.oldest_unpaid_days} days</small>
              </div>

              <div className="text-right shrink-0">
                <b className="text-text-primary block">
                  {formatPeso(r.total_debt, true)}
                </b>
                {r.is_overdue && (
                  <div className="mt-1">
                    <span className="pill bad">Overdue</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
