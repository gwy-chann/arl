import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSystemSettings } from '@/lib/settings/settings-service';
import { getTextBeeDeviceHealth } from '@/lib/services/textbee-health-service';
import { ReminderSettingsForm } from '@/components/settings/reminder-settings-form';
import { SmsGatewayStatusCard } from '@/components/settings/sms-status-card';

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

  const [settings, textBeeHealth] = await Promise.all([
    getSystemSettings(supabase ?? undefined),
    getTextBeeDeviceHealth(),
  ]);

  return (
    <div className="flex flex-col">
      <SmsGatewayStatusCard
        initialTextBeeHealth={textBeeHealth}
      />
      <ReminderSettingsForm initialSettings={settings} />
    </div>
  );
}
