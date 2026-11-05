import { ThemePicker } from '@/components/theme/theme-picker';
import { ModalToastShowcase } from '@/components/ui/modal-toast-showcase';

export const metadata = {
  title: 'Appearance · Settings · ARLQ',
  description: 'Manage appearance and theme preferences for ARLQ inventory and sales system',
};

export default function AppearanceSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
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

      {/* Modal & Toast Showcase (ARL-5) */}
      <ModalToastShowcase />
    </div>
  );
}
