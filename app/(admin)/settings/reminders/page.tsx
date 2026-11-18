import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSystemSettings } from '@/lib/settings/settings-service';
import { getPhilSmsBalance } from '@/lib/services/philsms-balance-service';
import { ReminderSettingsForm } from '@/components/settings/reminder-settings-form';
import { PhilSmsStatusCard } from '@/components/settings/philsms-status-card';

export const instant = false;

export const metadata = {
  title: 'Reminder Settings · ARLQ',
  description: 'Configure customer payment reminder cutoff days and administrator contact',
};

export default async function ReminderSettingsPage() {
  await connection();

  let supabase = null;
  try {
    supabase = await createClient();
  } catch {
    supabase = null;
  }

  const [settings, philSmsStatus] = await Promise.all([
    getSystemSettings(supabase ?? undefined),
    getPhilSmsBalance(),
  ]);

  return (
    <div className="flex flex-col">
      <PhilSmsStatusCard initialStatus={philSmsStatus} />
      <ReminderSettingsForm initialSettings={settings} />
    </div>
  );
}
