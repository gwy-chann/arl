import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

export const metadata = {
  title: 'Dashboard · ARLQ',
  description: 'Administrator dashboard for ARLQ inventory and sales system',
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

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  // Graceful fallback for local development when Supabase container is offline
  if (!user && process.env.NODE_ENV === 'development') {
    user = {
      id: 'dev-admin',
      email: 'admin@arlq.com',
      user_metadata: {
        name: 'Administrator',
        role: 'Owner account',
      },
    };
  }

  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  return (
    <div className="max-w-5xl">
      {/* Header Bar */}
      <div className="pb-6 mb-8 border-b border-border">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
          ARLQ Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Signed in as <span className="font-semibold text-text-secondary">{user.email}</span>
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-surface border border-border rounded-xl p-6 shadow-xs">
          <div className="text-sm font-semibold text-text-muted mb-1">Session Status</div>
          <div className="text-xl font-bold text-success flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
            Active Session
          </div>
          <p className="text-xs text-text-muted mt-3">
            Protected by Supabase SSR HTTP-only session cookies.
          </p>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-6 shadow-xs">
          <div className="text-sm font-semibold text-text-muted mb-1">Role & Permissions</div>
          <div className="text-xl font-bold text-text-primary">
            Store Administrator
          </div>
          <p className="text-xs text-text-muted mt-3">
            Full administrative access to inventory, sales, and settings.
          </p>
        </div>

        <div className="bg-bg-surface border border-border rounded-xl p-6 shadow-xs">
          <div className="text-sm font-semibold text-text-muted mb-1">Quick Links</div>
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href="/products/categories"
              className="text-sm text-primary hover:underline font-semibold flex items-center gap-1"
            >
              🏷️ Product Categories (ARL-7) →
            </Link>
            <Link
              href="/settings/appearance"
              className="text-sm text-primary hover:underline font-medium"
            >
              Theme & Appearance Settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
