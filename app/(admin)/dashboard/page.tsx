import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardService } from '@/lib/dashboard/dashboard-service';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardKpiCards } from '@/components/dashboard/dashboard-kpi-cards';
import { DashboardSalesChart } from '@/components/dashboard/dashboard-sales-chart';
import { DashboardStockMatrix } from '@/components/dashboard/dashboard-stock-matrix';
import { DashboardUrgentNotices } from '@/components/dashboard/dashboard-urgent-notices';
import { DashboardDebtRanking } from '@/components/dashboard/dashboard-debt-ranking';

export const instant = false;

export const metadata = {
  title: 'Dashboard · ARLQ',
  description: 'Executive dashboard with business KPIs, sales charts, inventory matrix, and urgent notices',
};

interface AdminUserMetadata {
  name?: string;
  role?: string;
}

export default async function DashboardPage() {
  await connection();

  let user: {
    id?: string;
    email?: string;
    user_metadata?: AdminUserMetadata;
  } | null = null;

  let supabaseClient = null;

  try {
    supabaseClient = await createClient();
    const { data } = await supabaseClient.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
    supabaseClient = null;
  }

  // Graceful fallback for local development when Supabase container is offline
  if (!user && process.env.NODE_ENV === 'development') {
    user = {
      id: 'dev-admin',
      email: 'admin@arlq.com',
      user_metadata: {
        name: 'Admin',
        role: 'Owner account',
      },
    };
  }

  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  const dashboardService = new DashboardService(supabaseClient);
  const data = await dashboardService.getDashboardData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Greetings & Action Triggers */}
      <DashboardHeader adminName={user?.user_metadata?.name || 'Admin'} />

      {/* 2. Top-Level Executive KPI Metric Cards */}
      <DashboardKpiCards kpis={data.kpis} />

      {/* 3. Responsive 2-Column Dashboard Grid */}
      <div className="dash-grid">
        <div className="stack">
          {/* Notifications / Urgent Action Stream */}
          <DashboardUrgentNotices notices={data.notices} />

          {/* 7-Day Rolling Sales Visualizer Bar Chart */}
          <DashboardSalesChart chart={data.sales_chart} />
        </div>

        <div className="stack">
          {/* 3x3 Stock On Hand Matrix */}
          <DashboardStockMatrix matrix={data.stock_matrix} />

          {/* Top 5 Debtor Ranking ("Who owes you") */}
          <DashboardDebtRanking ranking={data.debt_ranking} />
        </div>
      </div>
    </div>
  );
}
