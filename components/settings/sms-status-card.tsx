'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import {
  refreshPhilSmsBalanceAction,
  refreshTextBeeDeviceHealthAction,
} from '@/app/(admin)/settings/reminders/actions';
import { formatEstimatedPesoValue } from '@/lib/services/philsms-balance-service';
import { formatBatteryLabel } from '@/lib/services/textbee-health-service';
import type { PhilSmsAccountStatus } from '@/lib/services/philsms-contracts';
import type { TextBeeDeviceHealth } from '@/lib/services/textbee-contracts';

export interface SmsGatewayStatusCardProps {
  initialPhilSmsStatus?: PhilSmsAccountStatus | null;
  initialTextBeeHealth?: TextBeeDeviceHealth | null;
  defaultGateway?: 'TEXTBEE' | 'PHILSMS';
}

function formatHeartbeatTime(isoString?: string | null): string {
  if (!isoString) return 'Never';
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return 'Unknown';
  }
}

export function SmsGatewayStatusCard({
  initialPhilSmsStatus,
  initialTextBeeHealth,
  defaultGateway = 'TEXTBEE',
}: Readonly<SmsGatewayStatusCardProps>) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'TEXTBEE' | 'PHILSMS'>(() => {
    if (defaultGateway === 'TEXTBEE' && initialTextBeeHealth) return 'TEXTBEE';
    if (defaultGateway === 'PHILSMS' && initialPhilSmsStatus) return 'PHILSMS';
    return initialTextBeeHealth ? 'TEXTBEE' : 'PHILSMS';
  });

  const [textBeeStatus, setTextBeeStatus] = useState<TextBeeDeviceHealth | null>(
    initialTextBeeHealth ?? null
  );
  const [philSmsStatus, setPhilSmsStatus] = useState<PhilSmsAccountStatus | null>(
    initialPhilSmsStatus ?? null
  );

  const [isPending, startTransition] = useTransition();

  const handleRefreshTextBee = () => {
    startTransition(async () => {
      const res = await refreshTextBeeDeviceHealthAction({ forceRefresh: true });
      if (!res.success || !res.data) {
        showToast(res.error || 'Failed to refresh TextBee device health', undefined, 'danger');
        return;
      }
      setTextBeeStatus(res.data);
      showToast('TextBee device status updated');
    });
  };

  const handleRefreshPhilSms = () => {
    startTransition(async () => {
      const res = await refreshPhilSmsBalanceAction({ forceRefresh: true });
      if (!res.success || !res.data) {
        showToast(res.error || 'Failed to refresh PhilSMS balance', undefined, 'danger');
        return;
      }
      setPhilSmsStatus(res.data);
      showToast('PhilSMS balance updated');
    });
  };

  const hasBothGateways = Boolean(initialPhilSmsStatus && initialTextBeeHealth);

  // Status flags for TextBee
  const tbHealthy = textBeeStatus?.warningLevel === 'healthy';
  const tbWarning = textBeeStatus?.warningLevel === 'warning';
  const tbCritical = textBeeStatus?.warningLevel === 'critical';
  const tbMock = textBeeStatus?.warningLevel === 'mock' || textBeeStatus?.isMock;
  const tbError = textBeeStatus?.warningLevel === 'error' || !textBeeStatus?.success;

  // Status flags for PhilSMS
  const psHealthy = philSmsStatus?.warningLevel === 'healthy';
  const psWarning = philSmsStatus?.warningLevel === 'warning';
  const psCritical = philSmsStatus?.warningLevel === 'critical';
  const psMock = philSmsStatus?.warningLevel === 'mock' || philSmsStatus?.isMock;
  const psError = philSmsStatus?.warningLevel === 'error' || !philSmsStatus?.success;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 md:p-6 mb-6 shadow-xs">
      {/* Gateway Switcher Tabs (when both are configured) */}
      {hasBothGateways && (
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border">
          <span className="text-xs font-medium text-text-muted mr-1">Gateway Diagnostic:</span>
          <button
            type="button"
            onClick={() => setActiveTab('TEXTBEE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'TEXTBEE'
                ? 'bg-bg-muted text-text-primary border border-border shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                tbHealthy
                  ? 'bg-success'
                  : tbWarning
                  ? 'bg-accent'
                  : tbCritical
                  ? 'bg-danger'
                  : 'bg-text-muted'
              }`}
            />
            TextBee Android Gateway
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PHILSMS')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'PHILSMS'
                ? 'bg-bg-muted text-text-primary border border-border shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                psHealthy
                  ? 'bg-success'
                  : psWarning
                  ? 'bg-accent'
                  : psCritical
                  ? 'bg-danger'
                  : 'bg-text-muted'
              }`}
            />
            PhilSMS Telecom Cloud
          </button>
        </div>
      )}

      {/* --- View A: TextBee Android Phone Gateway --- */}
      {activeTab === 'TEXTBEE' && textBeeStatus && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-bg-muted border border-border text-text-primary">
                {/* Smartphone Device Icon */}
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
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-text-primary">
                    {textBeeStatus.deviceName}
                  </h3>
                  {textBeeStatus.deviceModel && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-bg-muted text-text-secondary border border-border">
                      {textBeeStatus.deviceModel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Physical Android SMS gateway connection health diagnostic & battery monitor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Gateway Status Badge */}
              {tbHealthy && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-light text-success border border-success-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Connected (TextBee Gateway)
                </span>
              )}

              {tbWarning && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-light text-accent border border-accent-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {textBeeStatus.statusText || 'Low Battery Warning'}
                </span>
              )}

              {tbCritical && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-light text-danger border border-danger-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                  {textBeeStatus.statusText || 'Device Offline'}
                </span>
              )}

              {tbMock && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg-muted text-text-muted border border-border-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                  Mock Gateway Mode (Offline Development)
                </span>
              )}

              {tbError && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-light text-danger border border-danger-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                  {textBeeStatus.statusText || 'Gateway Error'}
                </span>
              )}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefreshTextBee}
                disabled={isPending}
                title="Refresh device connectivity and battery level from TextBee"
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
                <span>{isPending ? 'Refreshing...' : 'Refresh Connection'}</span>
              </button>
            </div>
          </div>

          {/* Warning Banners */}
          {tbWarning && (
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
                  Low Gateway Phone Battery: {textBeeStatus.batteryPercentage}% remaining.
                </p>
                <p className="mt-0.5 text-accent opacity-90">
                  Connect the phone to a charger to prevent device shutdown and automated notification halts.
                </p>
              </div>
            </div>
          )}

          {tbCritical && (
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
                <p className="font-semibold">Critical Gateway Alert: {textBeeStatus.statusText}</p>
                <p className="mt-0.5 text-danger opacity-90">
                  {textBeeStatus.batteryPercentage < 10
                    ? `Battery is critically depleted at ${textBeeStatus.batteryPercentage}%. Plug in immediately.`
                    : 'The phone is currently disconnected or powered off. Outbound customer SMS reminders will halt until restored.'}
                </p>
              </div>
            </div>
          )}

          {tbError && textBeeStatus.errorMessage && (
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
                <p className="mt-0.5 text-danger opacity-90">{textBeeStatus.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Device Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {/* Metric 1: Battery Level */}
            <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-muted">Battery Status</span>
                {textBeeStatus.isCharging && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success-light px-1.5 py-0.5 rounded border border-success-border">
                    Charging
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-bold text-text-primary">
                  {textBeeStatus.batteryPercentage}%
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  {formatBatteryLabel(
                    textBeeStatus.batteryPercentage,
                    textBeeStatus.isCharging,
                    textBeeStatus.isMock
                  )}
                </span>
              </div>
              <div className="mt-2 w-full bg-bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    textBeeStatus.batteryPercentage < 10
                      ? 'bg-danger'
                      : textBeeStatus.batteryPercentage < 20
                      ? 'bg-accent'
                      : 'bg-success'
                  }`}
                  style={{ width: `${Math.max(5, textBeeStatus.batteryPercentage)}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Network Connectivity */}
            <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
              <span className="text-xs font-medium text-text-muted">Network Connection</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-bold text-text-primary">
                  {textBeeStatus.networkType === 'WIFI'
                    ? 'Wi-Fi'
                    : textBeeStatus.networkType === 'CELLULAR'
                    ? 'Cellular'
                    : textBeeStatus.networkType}
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  {textBeeStatus.isOnline ? 'Online' : 'Disconnected'}
                </span>
              </div>
              <span className="text-[11px] text-text-muted mt-1 truncate">
                {textBeeStatus.isOnline
                  ? 'Connected to store network'
                  : 'Cellular / Wi-Fi unreachable'}
              </span>
            </div>

            {/* Metric 3: Heartbeat & Cache Info */}
            <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
              <span className="text-xs font-medium text-text-muted">Gateway Heartbeat</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-text-primary truncate">
                  {formatHeartbeatTime(textBeeStatus.lastSeenAt)}
                </span>
              </div>
              <span className="text-[11px] text-text-muted mt-1">
                {textBeeStatus.cached
                  ? 'Serving from server cache (15m TTL)'
                  : textBeeStatus.isMock
                  ? 'Offline simulation mode'
                  : 'Live ping verified from device'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* --- View B: PhilSMS Telecom Cloud Gateway --- */}
      {activeTab === 'PHILSMS' && philSmsStatus && (
        <>
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
                    {philSmsStatus.senderId || 'ARL'}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Automated telecom credit balance monitor & gateway health diagnostic
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Gateway Status Badge */}
              {psHealthy && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success-light text-success border border-success-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Connected (PhilSMS Gateway)
                </span>
              )}

              {psWarning && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-light text-accent border border-accent-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Low Balance Warning
                </span>
              )}

              {psCritical && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-light text-danger border border-danger-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                  Critical Balance Alert
                </span>
              )}

              {psMock && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg-muted text-text-muted border border-border-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                  Mock Gateway Mode (Offline Development)
                </span>
              )}

              {psError && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-danger-light text-danger border border-danger-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                  {philSmsStatus.statusText || 'Gateway Error'}
                </span>
              )}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefreshPhilSms}
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
          {psWarning && (
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
                  Low SMS Credit Balance: {philSmsStatus.balance} credits remaining ({formatEstimatedPesoValue(philSmsStatus.balance)}).
                </p>
                <p className="mt-0.5 text-accent opacity-90">
                  Top up via PhilSMS to prevent sweep failures before automated overdue balance sweeps halt.
                </p>
              </div>
            </div>
          )}

          {psCritical && (
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
                  Critical: Only {philSmsStatus.balance} credits remaining!
                </p>
                <p className="mt-0.5 text-danger opacity-90">
                  Overdue balance sweeps will soon fail. Top up immediately via GCash or Maya at app.philsms.com.
                </p>
              </div>
            </div>
          )}

          {psError && philSmsStatus.errorMessage && (
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
                <p className="mt-0.5 text-danger opacity-90">{philSmsStatus.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Credit Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
              <span className="text-xs font-medium text-text-muted">Available SMS Credits</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-bold text-text-primary">
                  {psMock ? 'Unlimited' : philSmsStatus.balance.toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  {psMock ? '(Local Mock)' : 'credits'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
              <span className="text-xs font-medium text-text-muted">Estimated Peso Equivalent</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl md:text-2xl font-bold text-text-primary">
                  {psMock ? '—' : formatEstimatedPesoValue(philSmsStatus.balance)}
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  {psMock ? 'Mock Mode' : '(~₱0.50/SMS)'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-bg-surface border border-border flex flex-col justify-between">
              <span className="text-xs font-medium text-text-muted">Gateway Health Status</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-text-primary truncate">
                  {philSmsStatus.statusText}
                </span>
              </div>
              <span className="text-[11px] text-text-muted mt-1">
                {philSmsStatus.cached
                  ? 'Serving from server cache (15m TTL)'
                  : philSmsStatus.isMock
                  ? 'Offline development'
                  : 'Live fetched from gateway'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Named alias matching Jira ticket specification: SmsGatewayStatusCard
export { SmsGatewayStatusCard as SmsStatusCard };
