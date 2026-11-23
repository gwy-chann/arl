'use server';

import { getPhilSmsBalance } from '../../../../lib/services/philsms-balance-service.ts';
import type { PhilSmsAccountStatus } from '../../../../lib/services/philsms-contracts.ts';
import { getTextBeeDeviceHealth } from '../../../../lib/services/textbee-health-service.ts';
import type { TextBeeDeviceHealth } from '../../../../lib/services/textbee-contracts.ts';

async function safeRevalidatePath(path: string) {
  try {
    const cacheModule = await import('next/cache');
    if (typeof cacheModule.revalidatePath === 'function') {
      cacheModule.revalidatePath(path);
    }
  } catch {
    // Silently continue in environments where next/cache is not available (e.g., node:test runner)
  }
}

export interface PhilSmsAccountStatusActionResult {
  success: boolean;
  data?: PhilSmsAccountStatus;
  error?: string;
}

export interface TextBeeDeviceHealthActionResult {
  success: boolean;
  data?: TextBeeDeviceHealth;
  error?: string;
}

export interface SmsGatewayStatusActionResult {
  success: boolean;
  activeGateway: 'PHILSMS' | 'TEXTBEE' | 'DUAL';
  philsms?: PhilSmsAccountStatus;
  textbee?: TextBeeDeviceHealth;
  error?: string;
}

/**
 * Server action to fetch the current PhilSMS account and credit balance status.
 */
export async function getPhilSmsAccountStatusAction(): Promise<PhilSmsAccountStatusActionResult> {
  try {
    const status = await getPhilSmsBalance();
    return {
      success: status.success,
      data: status,
      error: status.errorMessage,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve PhilSMS balance';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to force-refresh PhilSMS credit balance from live gateway, bypassing the cache.
 */
export async function refreshPhilSmsBalanceAction(options?: {
  forceRefresh?: boolean;
}): Promise<PhilSmsAccountStatusActionResult> {
  try {
    const status = await getPhilSmsBalance({ forceRefresh: options?.forceRefresh ?? true });
    await safeRevalidatePath('/settings/reminders');
    return {
      success: status.success,
      data: status,
      error: status.errorMessage,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to refresh PhilSMS balance';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to fetch the current TextBee device health, battery status, and connectivity.
 */
export async function getTextBeeDeviceHealthAction(): Promise<TextBeeDeviceHealthActionResult> {
  try {
    const health = await getTextBeeDeviceHealth();
    return {
      success: health.success,
      data: health,
      error: health.errorMessage,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve TextBee device health';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to force-refresh TextBee device health from live gateway, bypassing the cache.
 */
export async function refreshTextBeeDeviceHealthAction(options?: {
  forceRefresh?: boolean;
}): Promise<TextBeeDeviceHealthActionResult> {
  try {
    const health = await getTextBeeDeviceHealth({ forceRefresh: options?.forceRefresh ?? true });
    await safeRevalidatePath('/settings/reminders');
    return {
      success: health.success,
      data: health,
      error: health.errorMessage,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to refresh TextBee device health';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to fetch unified SMS gateway status across available gateways.
 */
export async function getSmsGatewayStatusAction(options?: {
  forceRefresh?: boolean;
}): Promise<SmsGatewayStatusActionResult> {
  try {
    const force = options?.forceRefresh ?? false;
    const [philsms, textbee] = await Promise.all([
      getPhilSmsBalance({ forceRefresh: force }),
      getTextBeeDeviceHealth({ forceRefresh: force }),
    ]);

    if (force) {
      await safeRevalidatePath('/settings/reminders');
    }

    return {
      success: philsms.success || textbee.success,
      activeGateway: 'DUAL',
      philsms,
      textbee,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve SMS gateway status';
    return {
      success: false,
      activeGateway: 'DUAL',
      error: message,
    };
  }
}
