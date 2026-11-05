import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSystemSettings } from '@/lib/settings/settings-service';
import { ReminderSettingsForm } from '@/components/settings/reminder-settings-form';

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

  const settings = await getSystemSettings(supabase ?? undefined);

  return <ReminderSettingsForm initialSettings={settings} />;
}
