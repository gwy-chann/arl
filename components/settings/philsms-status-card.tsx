'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { refreshPhilSmsBalanceAction } from '@/app/(admin)/settings/reminders/actions';
import { formatEstimatedPesoValue } from '@/lib/services/philsms-balance-service';
import type { PhilSmsAccountStatus } from '@/lib/services/philsms-contracts';

interface PhilSmsStatusCardProps {
  initialStatus: PhilSmsAccountStatus;
}

export function PhilSmsStatusCard({ initialStatus }: Readonly<PhilSmsStatusCardProps>) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<PhilSmsAccountStatus>(initialStatus);

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await refreshPhilSmsBalanceAction({ forceRefresh: true });
      if (!res.success || !res.data) {
        showToast(res.error || 'Failed to refresh PhilSMS balance', undefined, 'danger');
        return;
      }
      setStatus(res.data);
      showToast('PhilSMS balance updated');
    });
  };

  const isHealthy = status.warningLevel === 'healthy';
  const isWarning = status.warningLevel === 'warning';
  const isCritical = status.warningLevel === 'critical';
  const isMock = status.warningLevel === 'mock' || status.isMock;
  const isError = status.warningLevel === 'error' || !status.success;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 md:p-6 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-bg-muted border border-border text-text-primary">
            {/* Telecom Tower / Radio Icon */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-text-primary">
                PhilSMS Gateway Infrastructure
              </h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-bg-muted text-text-secondary border border-border">
                {status.senderId || 'ARL'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Automated telecom credit balance monitor & gateway health diagnostic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Gateway Status Badge */}
          {isHealthy && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-light text-success border border-success-border">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Connected (PhilSMS Gateway)
            </span>
          )}

          {isWarning && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-light text-accent border border-accent-border">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Low Balance Warning
            </span>
          )}

          {isCritical && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-light text-danger border border-danger-border">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
              Critical Balance Alert
            </span>
          )}

          {isMock && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg-muted text-text-muted border border-border-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
              Mock Gateway Mode (Offline Development)
            </span>
          )}

          {isError && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-light text-danger border border-danger-border">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />
              {status.statusText || 'Gateway Error'}
            </span>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            title="Refresh balance from PhilSMS gateway"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-bg-surface hover:bg-bg-hover text-text-primary border border-border transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isPending ? 'Refreshing...' : 'Refresh Balance'}</span>
          </button>
        </div>
      </div>

      {/* Warning Banners */}
      {isWarning && (
        <div className="mt-4 p-3.5 rounded-lg bg-accent-light text-accent border border-accent-border flex items-start gap-2.5 text-xs leading-relaxed">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-semibold">
              Low SMS Credit Balance: {status.balance} credits remaining ({formatEstimatedPesoValue(status.balance)}).
            </p>
            <p className="mt-0.5 text-accent opacity-90">
              Top up via PhilSMS to prevent sweep failures before automated overdue balance sweeps halt.
            </p>
          </div>
        </div>
      )}

      {isCritical && (
        <div className="mt-4 p-3.5 rounded-lg bg-danger-light text-danger border border-danger-border flex items-start gap-2.5 text-xs leading-relaxed">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold">
              Critical: Only {status.balance} credits remaining!
            </p>
            <p className="mt-0.5 text-danger opacity-90">
              Overdue balance sweeps will soon fail. Top up immediately via GCash or Maya at app.philsms.com.
            </p>
          </div>
        </div>
      )}

      {isError && status.errorMessage && (
        <div className="mt-4 p-3.5 rounded-lg bg-danger-light text-danger border border-danger-border flex items-start gap-2.5 text-xs leading-relaxed">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold">Gateway Diagnostic Error</p>
            <p className="mt-0.5 text-danger opacity-90">{status.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Credit Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {/* Metric 1: Credit Balance */}
        <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-text-muted">Available SMS Credits</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold text-text-primary">
              {isMock ? 'Unlimited' : status.balance.toLocaleString()}
            </span>
            <span className="text-xs text-text-secondary font-medium">
              {isMock ? '(Local Mock)' : 'credits'}
            </span>
          </div>
        </div>

        {/* Metric 2: Estimated Value */}
        <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-text-muted">Estimated Peso Equivalent</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold text-text-primary">
              {isMock ? '—' : formatEstimatedPesoValue(status.balance)}
            </span>
            <span className="text-xs text-text-secondary font-medium">
              {isMock ? 'Mock Mode' : '(~₱0.50/SMS)'}
            </span>
          </div>
        </div>

        {/* Metric 3: Cache / Sync Info */}
        <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
          <span className="text-xs font-medium text-text-muted">Gateway Health Status</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-text-primary truncate">
              {status.statusText}
            </span>
          </div>
          <span className="text-[11px] text-text-muted mt-1">
            {status.cached
              ? 'Serving from server cache (15m TTL)'
              : status.isMock
              ? 'Offline development'
              : 'Live fetched from gateway'}
          </span>
        </div>
      </div>
    </div>
  );
}
