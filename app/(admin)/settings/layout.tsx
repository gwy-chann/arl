import Link from 'next/link';
import { SettingsTabs } from '@/components/settings/settings-tabs';

export const metadata = {
  title: 'Settings · ARLQ',
  description: 'Manage store configuration, reminder thresholds, stock minimums, and security settings',
};

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="max-w-4xl">
      {/* Settings Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between pb-6 mb-4 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-text-muted mb-1.5">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-text-primary font-semibold">Settings</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            Settings
          </h1>
        </div>

        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-md bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors cursor-pointer shadow-xs"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Tabs navigation */}
      <SettingsTabs />

      {/* Active Tab Page Content */}
      {children}
    </div>
  );
}
