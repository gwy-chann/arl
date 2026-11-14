import React from 'react';
import Link from 'next/link';
import type { UrgentNoticeDTO } from '@/lib/dashboard/dashboard-contracts';

export interface DashboardUrgentNoticesProps {
  notices: UrgentNoticeDTO[];
}

export function DashboardUrgentNotices({
  notices,
}: Readonly<DashboardUrgentNoticesProps>) {
  const count = notices.length;
  const pillStyle = count > 0 ? 'bad' : 'ok';
  const pillText = count > 0 ? `${count} need attention` : 'All clear';

  return (
    <section className="card" aria-label="Notifications & Urgent Alerts">
      <div className="card-h">
        <h2>Notifications</h2>
        <span className={`pill ${pillStyle}`}>{pillText}</span>
      </div>

      {count === 0 ? (
        <div className="empty">
          <b>All clear</b>
          <p>No overdue balances or low stock.</p>
        </div>
      ) : (
        <div>
          {notices.map((notice) => (
            <div key={notice.id} className="notice">
              <span className={`dot ${notice.badge_tone}`} aria-hidden="true" />
              <p>
                <b>{notice.title}</b> {notice.message}
                <small>{notice.subtitle}</small>
              </p>
              <Link
                href={notice.action_href}
                className="btn sec sm shrink-0"
              >
                {notice.action_label}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
