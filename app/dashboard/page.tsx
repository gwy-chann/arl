import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/login/actions'
import { ThemeToggle } from '@/app/login/theme-toggle'

export const instant = false

export const metadata = {
  title: 'Dashboard · ARLQ',
  description: 'Administrator dashboard for ARLQ inventory and sales system',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-border gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
              ARLQ Dashboard
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Signed in as <span className="font-semibold text-text-secondary">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-md bg-secondary hover:bg-secondary-hover text-text-primary border border-border-subtle transition-colors cursor-pointer shadow-xs"
              >
                <svg
                  className="w-4 h-4 text-danger"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Log out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Status Card */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <a
                href="#inventory"
                className="text-sm text-primary hover:underline font-medium"
              >
                View Inventory Catalog →
              </a>
              <a
                href="#sales"
                className="text-sm text-primary hover:underline font-medium"
              >
                View Sales & Utang →
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
