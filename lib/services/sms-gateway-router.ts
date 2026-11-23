import { sendSmsViaTextBee } from './textbee-adapter.ts';

export type SmsGatewayProvider = 'textbee' | 'mock';

export interface UnifiedSmsDispatchOptions {
  /** Target mobile number in Philippine format (e.g. '09171234567' or '+639171234567') */
  recipient: string;
  /** SMS message content */
  message: string;
  /** Optional custom sender ID */
  senderId?: string;
  /** Optional AbortSignal for enforcing timeout deadlines */
  signal?: AbortSignal;
  /** Optional runtime provider override */
  provider?: SmsGatewayProvider | string;
}

export interface UnifiedSmsDispatchResult {
  /** Whether the message was successfully dispatched / accepted */
  success: boolean;
  /** Unique message identifier assigned by the provider or mock generator */
  messageId?: string;
  /** The effective provider that processed the dispatch */
  provider: SmsGatewayProvider;
  /** Descriptive error message if dispatch failed */
  errorMessage?: string;
  /** Standardized error code for classification and resilience handling */
  errorCode?: string;
  /** Raw untransformed provider response payload */
  rawResponse?: unknown;
}

// In-flight mock handler for testing and isolation
type MockRouterHandler = (options: UnifiedSmsDispatchOptions) => Promise<UnifiedSmsDispatchResult>;
let mockRouterHandler: MockRouterHandler | null = null;

/**
 * Injects a mock dispatch handler for testing router integrations.
 */
export function _setMockGatewayHandler(handler: MockRouterHandler | null): void {
  mockRouterHandler = handler;
}

/**
 * Resets the active test mock handler.
 */
export function _resetGatewayRouterMock(): void {
  mockRouterHandler = null;
}

/**
 * Normalizes an arbitrary string or provider enum into a canonical SmsGatewayProvider.
 */
export function normalizeProviderName(raw?: string | null): SmsGatewayProvider | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === 'textbee') return 'textbee';
  if (cleaned === 'mock') return 'mock';
  return null;
}

/**
 * Resolves the active SMS gateway provider following the resolution hierarchy:
 * 1. Explicit provider passed in options
 * 2. Explicit SMS_GATEWAY_PROVIDER or ACTIVE_SMS_GATEWAY environment variable
 * 3. Default: 'textbee'
 */
export function resolveSmsGatewayProvider(
  options?: { provider?: SmsGatewayProvider | string }
): SmsGatewayProvider {
  // 1. Explicit option override
  if (options?.provider) {
    const fromOption = normalizeProviderName(options.provider);
    if (fromOption) return fromOption;
  }

  // 2. Environment variable configuration
  const envProvider = process.env.SMS_GATEWAY_PROVIDER || process.env.ACTIVE_SMS_GATEWAY;
  if (envProvider) {
    const fromEnv = normalizeProviderName(envProvider);
    if (fromEnv) return fromEnv;
  }

  // 3. Default
  return 'textbee';
}

/**
 * Unified SMS Gateway Dispatcher.
 * Routes outbound SMS dispatches to TextBee or mock fallback
 * and returns a normalized UnifiedSmsDispatchResult.
 */
export async function dispatchGatewaySms(
  options: UnifiedSmsDispatchOptions
): Promise<UnifiedSmsDispatchResult> {
  if (mockRouterHandler) {
    return mockRouterHandler(options);
  }

  const provider = resolveSmsGatewayProvider(options);

  if (provider === 'mock') {
    return {
      success: true,
      messageId: `mock_router_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      provider: 'mock',
      rawResponse: {
        mock: true,
        recipient: options.recipient,
        message: options.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const textBeeRes = await sendSmsViaTextBee({
    recipient: options.recipient,
    message: options.message,
    signal: options.signal,
  });

  return {
    success: textBeeRes.success,
    messageId: textBeeRes.messageId,
    provider: 'textbee',
    errorMessage: textBeeRes.errorMessage,
    errorCode: textBeeRes.errorCode,
    rawResponse: textBeeRes.rawResponse,
  };
}
