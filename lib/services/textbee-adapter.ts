import {
  TEXTBEE_DEFAULT_BASE_URL,
  type TextBeeErrorCode,
  type TextBeeMockRecord,
  type TextBeeSendOptions,
  type TextBeeSendResult,
} from './textbee-contracts.ts';

// In-memory mock registry for deterministic offline testing
const mockHistory: TextBeeMockRecord[] = [];

/**
 * Returns a read-only copy of all messages sent in offline mock mode.
 */
export function _getTextBeeMockHistory(): TextBeeMockRecord[] {
  return [...mockHistory];
}

/**
 * Clears the in-memory mock dispatch history.
 */
export function _resetTextBeeMockHistory(): void {
  mockHistory.length = 0;
}

// Test override handler for deterministic test injection
type MockSendHandler = (
  options: TextBeeSendOptions
) => Promise<Partial<TextBeeSendResult> & { success: boolean }> | Promise<TextBeeSendResult>;
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
 * Canonicalizes Philippine mobile numbers to E.164 format (+639XXXXXXXXX).
 * Accepts:
 *  - 09171234567 (11 digits starting with 09)
 *  - +639171234567 (13 chars starting with +639)
 *  - 639171234567 (12 digits starting with 639)
 *  - Formats with whitespace, dashes, dots, or parentheses (e.g. (0917) 123-4567)
 * 
 * Rejects numbers that do not match valid Philippine mobile prefixes or lengths.
 */
export function normalizePhilippineMobileForTextBee(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Invalid Philippine mobile number format');
  }

  // Strip spaces, dashes, dots, parentheses, and leading plus for parsing
  const clean = rawPhone.replace(/[\s\-\.\(\)]/g, '');
  if (!clean) {
    throw new Error('Invalid Philippine mobile number format');
  }

  let digits = clean;
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  // Check valid Philippine mobile patterns
  // Pattern 1: 09XXXXXXXXX (11 digits) -> +639XXXXXXXXX
  if (/^09\d{9}$/.test(digits)) {
    return `+63${digits.slice(1)}`;
  }

  // Pattern 2: 639XXXXXXXXX (12 digits) -> +639XXXXXXXXX
  if (/^639\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  throw new Error('Invalid Philippine mobile number format');
}

/**
 * Dispatches an outbound SMS message through the TextBee Android Gateway REST API.
 * 
 * Supports:
 * - Strict Philippine mobile number canonicalization (+639XXXXXXXXX)
 * - 5,000ms AbortSignal deadline propagation
 * - Device offline and disconnection error classification
 * - Offline mock mode when TEXTBEE_MOCK_DISPATCH="true" or TEXTBEE_API_KEY is not configured
 * - In-memory mock history inspection via _getTextBeeMockHistory()
 * - Deterministic testing hooks via _setMockTextBeeSendHandler
 */
export async function sendSmsViaTextBee(
  options: TextBeeSendOptions
): Promise<TextBeeSendResult> {
  const { recipient: rawRecipient, message, signal } = options;

  // 1. Check for test handler override
  if (mockSendHandler) {
    const rawRes = await mockSendHandler(options);
    return {
      gateway: 'TEXTBEE',
      recipient: options.recipient || '',
      ...rawRes,
    };
  }

  // 2. Validate recipient
  if (!rawRecipient || !rawRecipient.trim()) {
    return {
      success: false,
      recipient: '',
      gateway: 'TEXTBEE',
      errorCode: 'INVALID_RECIPIENT_MOBILE',
      errorMessage: 'Recipient mobile number is required',
    };
  }

  let normalizedRecipient: string;
  try {
    normalizedRecipient = normalizePhilippineMobileForTextBee(rawRecipient);
  } catch {
    return {
      success: false,
      recipient: rawRecipient.trim(),
      gateway: 'TEXTBEE',
      errorCode: 'INVALID_RECIPIENT_MOBILE',
      errorMessage: 'Invalid Philippine mobile number format',
    };
  }

  // 3. Validate message body
  if (!message || !message.trim()) {
    return {
      success: false,
      recipient: normalizedRecipient,
      gateway: 'TEXTBEE',
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

  // 4. Offline Mock Mode
  if (isMock) {
    const mockMsgId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `textbee_${crypto.randomUUID()}`
        : `textbee_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const mockRecord: TextBeeMockRecord = {
      recipient: normalizedRecipient,
      message,
      timestamp: new Date().toISOString(),
      messageId: mockMsgId,
      deviceId,
    };
    mockHistory.push(mockRecord);

    return {
      success: true,
      messageId: mockMsgId,
      recipient: normalizedRecipient,
      gateway: 'TEXTBEE',
      rawResponse: {
        mock: true,
        deviceId,
        recipient: normalizedRecipient,
        messageLength: message.length,
        dispatchedAt: mockRecord.timestamp,
      },
    };
  }

  // 5. Live Gateway Dispatch
  try {
    const endpoint = `${baseUrl}/gateway/devices/${encodeURIComponent(deviceId)}/sendSMS`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        recipients: [normalizedRecipient],
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

    if (response.ok && data.success !== false) {
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
        recipient: normalizedRecipient,
        gateway: 'TEXTBEE',
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
      recipient: normalizedRecipient,
      gateway: 'TEXTBEE',
      errorCode,
      errorMessage: errorMsg,
      rawResponse: { status, ...data },
    };
  } catch (err) {
    if (signal?.aborted || (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError'))) {
      return {
        success: false,
        recipient: normalizedRecipient,
        gateway: 'TEXTBEE',
        errorCode: 'TIMEOUT',
        errorMessage: 'TextBee dispatch timed out after 5000ms',
      };
    }

    return {
      success: false,
      recipient: normalizedRecipient,
      gateway: 'TEXTBEE',
      errorCode: 'NETWORK_UNREACHABLE',
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
