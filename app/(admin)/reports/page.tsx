import { redirect } from 'next/navigation';

export const instant = false;

export default function ReportsIndexPage() {
  redirect('/reports/sales');
}
