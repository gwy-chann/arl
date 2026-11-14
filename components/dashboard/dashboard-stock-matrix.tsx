import React from 'react';
import Link from 'next/link';
import type { StockMatrixRowDTO } from '@/lib/dashboard/dashboard-contracts';

export interface DashboardStockMatrixProps {
  matrix: StockMatrixRowDTO[];
}

export function DashboardStockMatrix({ matrix }: Readonly<DashboardStockMatrixProps>) {
  return (
    <section className="card" aria-label="Stock on hand inventory matrix">
      <div className="card-h">
        <h2>Stock on hand</h2>
        <Link
          href="/inventory"
          className="text-primary hover:underline text-sm font-semibold transition-colors"
        >
          Details
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="stockgrid">
          <thead>
            <tr>
              <th>Product</th>
              <th>350 ml</th>
              <th>1 L</th>
              <th>1 gal</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.product_id}>
                <td>
                  <b className="font-semibold text-text-primary text-[15px]">{row.product_name}</b>
                  {row.category_name && (
                    <span className="block text-xs text-text-muted mt-0.5">{row.category_name}</span>
                  )}
                </td>
                {row.variants.map((v) => (
                  <td key={v.variant_id}>
                    <div className="level">
                      <b
                        className={`font-semibold text-[15px] ${
                          v.is_low ? 'text-danger' : 'text-text-primary'
                        }`}
                      >
                        {v.stock_quantity}
                      </b>
                      <div
                        className={`meter ${v.is_low ? 'low' : ''}`}
                        title={`${v.size_label}: ${v.stock_quantity} in stock (min ${v.min_stock_level})`}
                      >
                        <i style={{ width: `${v.capacity_percentage}%` }} />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
