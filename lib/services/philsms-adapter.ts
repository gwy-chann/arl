import {
  PHILSMS_CANONICAL_MOBILE_REGEX,
  PHILSMS_DEFAULT_BASE_URL,
  PHILSMS_DEFAULT_SENDER_ID,
  GSM7_BASIC_CHARS,
  GSM7_EXTENDED_CHARS,
  GSM7_SINGLE_MAX,
  GSM7_CONCAT_MAX,
  UCS2_SINGLE_MAX,
  UCS2_CONCAT_MAX,
  type PhilSmsSendOptions,
  type PhilSmsSendResult,
  type PhilSmsErrorCode,
  type Gsm7EncodingSummary,
  type PhilSmsMockRecord,
} from './philsms-contracts.ts';

/**
 * Normalizes and canonicalizes any standard Philippine phone representation
 * into the required PhilSMS 12-digit format: "639XXXXXXXXX".
 *
 * @throws {Error} if the phone number cannot be parsed into a valid Philippine mobile number.
 */
export function normalizePhilippineMobileForPhilSms(mobile: string): string {
  if (!mobile || typeof mobile !== 'string') {
    throw new Error('Invalid Philippine mobile number format');
  }

  // Strip all non-digit and non-plus characters (whitespace, dashes, parens, dots)
  let cleaned = mobile.replaceAll(/[\s\-().]/g, '');

  if (cleaned.startsWith('+63')) {
    cleaned = cleaned.slice(1); // remove '+' -> '63...'
  } else if (cleaned.startsWith('09')) {
    cleaned = `63${cleaned.slice(1)}`; // replace '0' with '63' -> '639...'
  }

  if (!PHILSMS_CANONICAL_MOBILE_REGEX.test(cleaned)) {
    throw new Error('Invalid Philippine mobile number format');
  }

  return cleaned;
}

/**
 * Normalizes text to maximize GSM-7 encoding compatibility and prevent
 * the expensive 70-character UCS-2 billing penalty.
 *
 * Specific transformations:
 * 1. Replaces '₱' (\u20B1) with 'PHP '
 * 2. Replaces smart double quotes (“ ”) with ASCII double quote (")
 * 3. Replaces smart single quotes / apostrophes (‘ ’) with ASCII single quote (')
 * 4. Replaces en-dash and em-dash (– —) with ASCII hyphen (-)
 * 5. Trims leading and trailing whitespace.
 */
export function normalizeAndSanitizeGsm7(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replaceAll(/\u20B1/g, 'PHP ')
    .replaceAll(/[\u201C\u201D]/g, '"')
    .replaceAll(/[\u2018\u2019]/g, "'")
    .replaceAll(/[\u2013\u2014]/g, '-')
    .trim();
}

/**
 * Analyzes SMS message text and calculates character count, encoding mode,
 * segment count, and estimated telco credit consumption.
 */
export function calculateSmsSegments(text: string): Gsm7EncodingSummary {
  if (!text || text.length === 0) {
    return {
      encoding: 'GSM-7',
      characterCount: 0,
      segmentCount: 0,
      estimatedCredits: 0,
      hasNonGsmCharacters: false,
    };
  }

  let effectiveLength = 0;
  const nonGsmChars: string[] = [];

  for (const char of text) {
    if (GSM7_BASIC_CHARS.has(char)) {
      effectiveLength += 1;
    } else if (GSM7_EXTENDED_CHARS.has(char)) {
      effectiveLength += 2; // Extension characters count as 2 septets
    } else {
      nonGsmChars.push(char);
    }
  }

  if (nonGsmChars.length > 0) {
    // UCS-2 encoding fallback
    const charCount = text.length;
    const segmentCount = charCount <= UCS2_SINGLE_MAX ? 1 : Math.ceil(charCount / UCS2_CONCAT_MAX);

    return {
      encoding: 'UCS-2',
      characterCount: charCount,
      segmentCount,
      estimatedCredits: segmentCount,
      hasNonGsmCharacters: true,
      nonGsmCharacters: [...new Set(nonGsmChars)],
    };
  }

  // GSM-7 encoding
  const segmentCount = effectiveLength <= GSM7_SINGLE_MAX ? 1 : Math.ceil(effectiveLength / GSM7_CONCAT_MAX);

  return {
    encoding: 'GSM-7',
    characterCount: effectiveLength,
    segmentCount,
    estimatedCredits: segmentCount,
    hasNonGsmCharacters: false,
  };
}

// In-memory mock registry for deterministic offline testing and CI
let mockPhilSmsHistory: PhilSmsMockRecord[] = [];

/**
 * Retrieves a copy of all mock-dispatched PhilSMS payloads.
 */
export function _getPhilSmsMockHistory(): PhilSmsMockRecord[] {
  return [...mockPhilSmsHistory];
}

/**
 * Resets the in-memory mock PhilSMS dispatch history.
 */
export function _resetPhilSmsMockHistory(): void {
  mockPhilSmsHistory = [];
}

/**
 * Maps HTTP response statuses and error payloads to standardized PhilSMS error codes.
 */
function mapGatewayError(
  status: number,
  responseBody: unknown,
  recipient: string,
  senderId: string,
  encodingSummary: Gsm7EncodingSummary
): PhilSmsSendResult {
  let errorCode: PhilSmsErrorCode = 'GATEWAY_UNKNOWN_ERROR';
  let message = 'SMS gateway returned an error response';

  if (typeof responseBody === 'object' && responseBody !== null) {
    const obj = responseBody as Record<string, unknown>;
    if (typeof obj.message === 'string') {
      message = obj.message;
    }
  } else if (typeof responseBody === 'string') {
    message = responseBody;
  }

  switch (status) {
    case 400:
      errorCode = 'GATEWAY_BAD_REQUEST';
      break;
    case 401:
      errorCode = 'GATEWAY_AUTH_ERROR';
      message = message || 'Unauthorized: Invalid PhilSMS API Token';
      break;
    case 402:
      errorCode = 'INSUFFICIENT_CREDITS';
      message = message || 'Insufficient credit balance';
      break;
    case 422:
      errorCode = 'INVALID_RECIPIENT_MOBILE';
      message = message || 'Unprocessable recipient mobile number';
      break;
    case 429:
      errorCode = 'GATEWAY_RATE_LIMITED';
      message = message || 'Rate limit exceeded on PhilSMS gateway';
      break;
    default:
      if (status >= 500) {
        errorCode = 'NETWORK_UNREACHABLE';
        message = message || 'PhilSMS upstream gateway unavailable';
      }
      break;
  }

  return {
    success: false,
    recipient,
    senderId,
    encoding: encodingSummary.encoding,
    segments: encodingSummary.segmentCount,
    errorCode,
    errorMessage: message,
    rawResponse: responseBody,
  };
}

/**
 * Dispatches an outbound SMS message through the PhilSMS REST API v3.
 *
 * Implements:
 * - Strict Philippine phone canonicalization (639XXXXXXXXX)
 * - Automated GSM-7 payload normalization (stripping ₱ and UCS-2 triggers)
 * - Server-only Bearer token authentication
 * - Deterministic offline mock dispatch mode (when PHILSMS_MOCK_DISPATCH="true" or token unset)
 * - Standardized error code mapping
 */
export async function sendSmsViaPhilSms(options: PhilSmsSendOptions): Promise<PhilSmsSendResult> {
  const senderId = (
    options.senderId ||
    process.env.PHILSMS_SENDER_ID ||
    PHILSMS_DEFAULT_SENDER_ID
  ).trim();

  // 1. Phone number canonicalization
  let canonicalRecipient: string;
  try {
    canonicalRecipient = normalizePhilippineMobileForPhilSms(options.recipient);
  } catch {
    return {
      success: false,
      recipient: options.recipient,
      senderId,
      encoding: 'GSM-7',
      segments: 0,
      errorCode: 'INVALID_RECIPIENT_MOBILE',
      errorMessage: 'Invalid Philippine mobile number format',
    };
  }

  // 2. Automated GSM-7 text sanitization and segment calculation
  const message = options.bypassNormalization
    ? (options.message || '')
    : normalizeAndSanitizeGsm7(options.message);

  const encodingSummary = calculateSmsSegments(message);

  // 3. Check for offline mock dispatch mode
  const apiToken = process.env.PHILSMS_API_TOKEN?.trim();
  const isMockDispatch =
    process.env.PHILSMS_MOCK_DISPATCH === 'true' ||
    !apiToken;

  if (isMockDispatch) {
    const mockId = `mock_philsms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const mockRecord: PhilSmsMockRecord = {
      id: mockId,
      recipient: canonicalRecipient,
      senderId,
      message,
      timestamp: new Date().toISOString(),
      encoding: encodingSummary.encoding,
      segments: encodingSummary.segmentCount,
    };
    mockPhilSmsHistory.push(mockRecord);

    return {
      success: true,
      messageId: mockId,
      recipient: canonicalRecipient,
      senderId,
      cost: encodingSummary.estimatedCredits,
      encoding: encodingSummary.encoding,
      segments: encodingSummary.segmentCount,
    };
  }

  // 4. Live Gateway Dispatch
  const baseUrl = (process.env.PHILSMS_API_BASE_URL || PHILSMS_DEFAULT_BASE_URL).replace(/\/+$/, '');
  const endpoint = `${baseUrl}/sms/send`;

  const requestBody = {
    recipient: canonicalRecipient,
    sender_id: senderId,
    type: 'plain',
    message,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });

    const responseText = await response.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(responseText);
    } catch {
      // Body not JSON
    }

    if (response.ok) {
      if (json && json.status === 'error') {
        return mapGatewayError(response.status, json, canonicalRecipient, senderId, encodingSummary);
      }

      const uid = (json?.data as Record<string, unknown> | undefined)?.uid;
      const messageId = typeof uid === 'string' ? uid : `philsms_${Date.now()}`;
      const gatewayCost = (json?.data as Record<string, unknown> | undefined)?.cost;
      const cost = typeof gatewayCost === 'number' ? gatewayCost : encodingSummary.estimatedCredits;

      return {
        success: true,
        messageId,
        recipient: canonicalRecipient,
        senderId,
        cost,
        encoding: encodingSummary.encoding,
        segments: encodingSummary.segmentCount,
        rawResponse: json || responseText,
      };
    }

    return mapGatewayError(response.status, json || responseText, canonicalRecipient, senderId, encodingSummary);
  } catch (err) {
    return {
      success: false,
      recipient: canonicalRecipient,
      senderId,
      encoding: encodingSummary.encoding,
      segments: encodingSummary.segmentCount,
      errorCode: 'NETWORK_UNREACHABLE',
      errorMessage: err instanceof Error ? err.message : 'Network unreachable',
    };
  }
}
