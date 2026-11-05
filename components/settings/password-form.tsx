'use client';

import { useState, useTransition, useRef } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { updatePasswordAction } from '@/lib/settings/settings-actions';

export function PasswordForm() {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation: match and length check
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', undefined, 'danger');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', undefined, 'danger');
      return;
    }

    startTransition(async () => {
      const res = await updatePasswordAction({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to update password', undefined, 'danger');
        return;
      }

      // Reset fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      formRef.current?.reset();

      showToast('Password updated');
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-bg-surface border border-border rounded-xl shadow-xs overflow-hidden max-w-lg"
    >
      <div className="p-5 md:p-6 flex flex-col gap-4">
        {/* Current Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p0" className="text-sm font-semibold text-text-primary">
            Current password
          </label>
          <input
            id="p0"
            name="current_password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="bg-bg-input border border-border focus:border-border-focus text-text-primary px-3 py-2 rounded-md text-sm outline-hidden transition-colors"
          />
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p1" className="text-sm font-semibold text-text-primary">
            New password
          </label>
          <input
            id="p1"
            name="new_password"
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            aria-describedby="p1-hint"
            className="bg-bg-input border border-border focus:border-border-focus text-text-primary px-3 py-2 rounded-md text-sm outline-hidden transition-colors"
          />
          <span id="p1-hint" className="text-xs text-text-muted">
            At least 8 characters.
          </span>
        </div>

        {/* Confirm New Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p2" className="text-sm font-semibold text-text-primary">
            Confirm new password
          </label>
          <input
            id="p2"
            name="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="bg-bg-input border border-border focus:border-border-focus text-text-primary px-3 py-2 rounded-md text-sm outline-hidden transition-colors"
          />
        </div>
      </div>

      {/* Form Footer */}
      <div className="bg-bg-muted border-t border-border px-5 py-3.5 flex justify-end gap-2.5">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary-hover text-text-light font-semibold px-4 py-2 text-sm rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </form>
  );
}
