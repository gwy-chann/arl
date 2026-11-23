import {
  TEXTBEE_DEFAULT_BASE_URL,
  type TextBeeErrorCode,
  type TextBeeSendOptions,
  type TextBeeSendResult,
} from './textbee-contracts.ts';

// Test override handler for deterministic test injection
type MockSendHandler = (options: TextBeeSendOptions) => Promise<TextBeeSendResult>;
let mockSendHandler: MockSendHandler | null = null;

/**
 * Injects a mock send handler for unit and resilience testing.
 */
export function _setMockTextBeeSendHandler(handler: MockSendHandler | null): void {
  mockSendHandler = handler;
}

/**
 * Resets any active mock send handler.
 */
export function _resetTextBeeSendMock(): void {
  mockSendHandler = null;
}

/**
 * Dispatches an outbound SMS message through the TextBee Android Gateway REST API.
 * 
 * Supports:
 * - 5,000ms AbortSignal deadline propagation
 * - Device offline and disconnection error classification
 * - Offline mock mode when TEXTBEE_MOCK_DISPATCH="true" or TEXTBEE_API_KEY is not configured
 * - Deterministic testing hooks via _setMockTextBeeSendHandler
 */
export async function sendSmsViaTextBee(
  options: TextBeeSendOptions
): Promise<TextBeeSendResult> {
  // 1. Check for test handler override
  if (mockSendHandler) {
    return mockSendHandler(options);
  }

  const { recipient, message, signal } = options;

  // 2. Validate inputs
  if (!recipient || !recipient.trim()) {
    return {
      success: false,
      errorCode: 'INVALID_RECIPIENT_MOBILE',
      errorMessage: 'Recipient mobile number is required',
    };
  }

  if (!message || !message.trim()) {
    return {
      success: false,
      errorCode: 'GATEWAY_BAD_REQUEST',
      errorMessage: 'SMS message body cannot be empty',
    };
  }

  const apiKey = (options.apiKey || process.env.TEXTBEE_API_KEY || '').trim();
  const deviceId = (
    options.deviceId ||
    process.env.TEXTBEE_DEVICE_ID ||
    'device_arlq_primary'
  ).trim();
  const baseUrl = (
    options.baseUrl ||
    process.env.TEXTBEE_API_URL ||
    process.env.TEXTBEE_BASE_URL ||
    TEXTBEE_DEFAULT_BASE_URL
  ).replace(/\/+$/, '');

  const isMock =
    process.env.TEXTBEE_MOCK_DISPATCH === 'true' ||
    !apiKey;

  // 3. Offline Mock Mode
  if (isMock) {
    const mockMsgId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `textbee_${crypto.randomUUID()}`
        : `textbee_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
      success: true,
      messageId: mockMsgId,
      rawResponse: {
        mock: true,
        deviceId,
        recipient,
        messageLength: message.length,
        dispatchedAt: new Date().toISOString(),
      },
    };
  }

  // 4. Live Gateway Dispatch
  try {
    const endpoint = `${baseUrl}/gateway/devices/${encodeURIComponent(deviceId)}/sendSMS`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        recipients: [recipient],
        message,
      }),
      signal,
    });

    const status = response.status;
    let data: Record<string, unknown> = {};
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      // Non-JSON response
    }

    if (response.ok && (data.success !== false)) {
      const messageId =
        (data.data as Record<string, unknown>)?.id ??
        data.messageId ??
        data.id ??
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? `textbee_${crypto.randomUUID()}`
          : `textbee_msg_${Date.now()}`);

      return {
        success: true,
        messageId: String(messageId),
        rawResponse: data,
      };
    }

    // Determine error details
    const errorMsg =
      String(data.message || data.error || data.errorMessage || `HTTP ${status}`);
    const lowerMsg = errorMsg.toLowerCase();

    // Map HTTP & error signatures
    let errorCode: TextBeeErrorCode = 'GATEWAY_SERVER_ERROR';

    if (
      status === 503 ||
      status === 504 ||
      lowerMsg.includes('offline') ||
      lowerMsg.includes('disconnected') ||
      lowerMsg.includes('unreachable') ||
      lowerMsg.includes('device_offline')
    ) {
      errorCode = 'DEVICE_OFFLINE';
    } else if (status === 401 || status === 403) {
      errorCode = 'GATEWAY_AUTH_ERROR';
    } else if (status === 404) {
      errorCode = 'DEVICE_NOT_FOUND';
    } else if (status === 400 || status === 422) {
      errorCode = 'GATEWAY_BAD_REQUEST';
    } else if (status === 429) {
      errorCode = 'GATEWAY_RATE_LIMITED';
    } else if (status >= 500) {
      errorCode = 'GATEWAY_SERVER_ERROR';
    }

    return {
      success: false,
      errorCode,
      errorMessage: errorMsg,
      rawResponse: { status, ...data },
    };
  } catch (err) {
    if (signal?.aborted || (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError'))) {
      return {
        success: false,
        errorCode: 'TIMEOUT',
        errorMessage: 'TextBee dispatch timed out after 5000ms',
      };
    }

    return {
      success: false,
      errorCode: 'NETWORK_UNREACHABLE',
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
