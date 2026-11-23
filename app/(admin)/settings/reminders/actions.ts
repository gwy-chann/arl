'use server';

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

export interface TextBeeDeviceHealthActionResult {
  success: boolean;
  data?: TextBeeDeviceHealth;
  error?: string;
}

export interface SmsGatewayStatusActionResult {
  success: boolean;
  activeGateway: 'TEXTBEE';
  textbee?: TextBeeDeviceHealth;
  error?: string;
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
 * Server action to fetch unified SMS gateway status for TextBee.
 */
export async function getSmsGatewayStatusAction(options?: {
  forceRefresh?: boolean;
}): Promise<SmsGatewayStatusActionResult> {
  try {
    const force = options?.forceRefresh ?? false;
    const textbee = await getTextBeeDeviceHealth({ forceRefresh: force });

    if (force) {
      await safeRevalidatePath('/settings/reminders');
    }

    return {
      success: textbee.success,
      activeGateway: 'TEXTBEE',
      textbee,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve SMS gateway status';
    return {
      success: false,
      activeGateway: 'TEXTBEE',
      error: message,
    };
  }
}
