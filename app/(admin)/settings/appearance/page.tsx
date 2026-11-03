import Link from 'next/link';
import { ThemePicker } from '@/components/theme/theme-picker';

export const metadata = {
  title: 'Appearance Settings · ARLQ',
  description: 'Manage appearance and theme preferences for ARLQ inventory and sales system',
};

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-4xl">
      {/* Navigation Breadcrumb & Header */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-text-muted mb-1.5">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-text-secondary font-medium">Settings</span>
            <span>/</span>
            <span className="text-text-primary font-semibold">Appearance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            Appearance Settings
          </h1>
        </div>

        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-md bg-secondary hover:bg-secondary-hover text-text-primary border border-border-subtle transition-colors cursor-pointer shadow-xs"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Theme Settings Card */}
      <section className="bg-bg-surface border border-border rounded-xl p-6 md:p-8 shadow-xs">
        <div className="pb-4 mb-5 border-b border-border">
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Theme & Display
          </h2>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Choose how ARLQ looks for your account. You can also quickly toggle between light and
            dark mode anytime in the topbar or sidebar.
          </p>
        </div>

        <ThemePicker />
      </section>
    </div>
  );
}
