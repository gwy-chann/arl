import { PasswordForm } from '@/components/settings/password-form';

export const metadata = {
  title: 'Change Password · Settings · ARLQ',
  description: 'Update administrator account login password and access security',
};

export default function PasswordSettingsPage() {
  return <PasswordForm />;
}
