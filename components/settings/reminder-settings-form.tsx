'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { saveReminderSettingsAction } from '@/lib/settings/settings-actions';
import { formatReminderSampleMessage } from '@/lib/settings/settings-service';
import type { SystemSettingsDTO } from '@/lib/settings/settings-contracts';

interface ReminderSettingsFormProps {
  initialSettings: SystemSettingsDTO;
}

export function ReminderSettingsForm({ initialSettings }: Readonly<ReminderSettingsFormProps>) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [days, setDays] = useState<number>(initialSettings.reminder_days);
  const [mobile, setMobile] = useState<string>(initialSettings.admin_mobile);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const sampleMessage = formatReminderSampleMessage(
    'Aling Nena’s Sari-Sari Store',
    1340.0,
    'ARLQ-01058',
    days || 7
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const res = await saveReminderSettingsAction({
        reminder_days: Number(days),
        admin_mobile: mobile.trim(),
        notification_channel: 'SMS',
      });

      if (!res.success) {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        showToast(res.error || 'Failed to save reminder settings', undefined, 'danger');
        return;
      }

      showToast('Reminder settings saved');
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-bg-surface border border-border rounded-xl shadow-xs overflow-hidden"
    >
      <div className="p-5 md:p-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Days threshold input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rd" className="text-sm font-semibold text-text-primary">
              Send a reminder after (days unpaid)
            </label>
            <input
              id="rd"
              name="reminder_days"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value === '' ? 1 : Number(e.target.value))}
              required
              aria-describedby="rd-hint rd-error"
              className="bg-bg-input border border-border focus:border-border-focus text-text-primary px-3 py-2 rounded-md text-sm outline-hidden transition-colors"
            />
            <span id="rd-hint" className="text-xs text-text-muted">
              Default is 7 days.
            </span>
            {fieldErrors.reminder_days && (
              <span id="rd-error" className="text-xs text-danger font-medium">
                {fieldErrors.reminder_days[0]}
              </span>
            )}
          </div>

          {/* Admin mobile number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rm" className="text-sm font-semibold text-text-primary">
              Administrator mobile number
            </label>
            <input
              id="rm"
              name="admin_mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              aria-describedby="rm-hint rm-error"
              className="bg-bg-input border border-border focus:border-border-focus text-text-primary px-3 py-2 rounded-md text-sm outline-hidden transition-colors"
            />
            <span id="rm-hint" className="text-xs text-text-muted">
              Reminders go to you only, never to customers.
            </span>
            {fieldErrors.admin_mobile && (
              <span id="rm-error" className="text-xs text-danger font-medium">
                {fieldErrors.admin_mobile[0]}
              </span>
            )}
          </div>
        </div>

        {/* Channel select (disabled SMS) */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rc" className="text-sm font-semibold text-text-primary">
            Notification channel
          </label>
          <select
            id="rc"
            name="notification_channel"
            disabled
            className="bg-bg-muted border border-border text-text-muted px-3 py-2 rounded-md text-sm cursor-not-allowed max-w-xs"
          >
            <option value="SMS">SMS</option>
          </select>
          <span className="text-xs text-text-muted">
            SMS is the only channel. Alerts also show on the Dashboard.
          </span>
        </div>

        {/* Dynamic sample preview box */}
        <div className="bg-bg-muted border border-border rounded-lg p-4 text-sm text-text-secondary leading-relaxed">
          <b className="text-text-primary block mb-1">Sample message</b>
          {sampleMessage}
        </div>
      </div>

      {/* Form Footer */}
      <div className="bg-bg-muted border-t border-border px-5 py-3.5 flex justify-end gap-2.5">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary-hover text-text-light font-semibold px-4 py-2 text-sm rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
