import { stripEmojis } from './assistant-guardrails.ts';

/**
 * Standardized client-facing error notices (Strict Zero-Emoji Policy)
 */
export const MISSING_API_KEY_MESSAGE =
  'The store assistant is not configured. Please configure GEMINI_API_KEY in the environment settings.';

export const RATE_LIMIT_MESSAGE =
  'The store assistant is receiving high request traffic. Please wait 30 seconds before sending another question.';

export const TIMEOUT_MESSAGE =
  'The request timed out while checking store records. Please try again.';

export const UPSTREAM_OUTAGE_MESSAGE =
  'The store assistant service is temporarily unavailable. Please try again shortly.';

export const GENERIC_ERROR_MESSAGE =
  'An unexpected error occurred while processing your request. Please try again.';

export const STATUS_INDICATOR_MESSAGE = 'Checking store records...';

/**
 * Context Pruning (Sliding Window Mechanism)
 *
 * Retains only the most recent `maxTurns` (default: 6 turns = 3 user turns + 3 assistant turns).
 * Guarantees that token limits are never exhausted by long conversational sessions.
 */
export function pruneConversationHistory<T>(messages: T[], maxTurns = 6): T[] {
  if (!Array.isArray(messages)) {
    return [];
  }
  if (messages.length <= maxTurns) {
    return [...messages];
  }
  return messages.slice(-maxTurns);
}

export interface MappedErrorResult {
  status: number;
  message: string;
}

/**
 * Maps upstream Google Generative AI errors, HTTP status codes, and network exceptions
 * into structured, safe HTTP responses with zero-emoji messages.
 */
export function mapGeminiError(
  errorOrStatus: unknown,
  responseBody?: string
): MappedErrorResult {
  // Check for AbortError or timeout indicators
  if (
    errorOrStatus === 504 ||
    (errorOrStatus instanceof Error &&
      (errorOrStatus.name === 'AbortError' ||
        errorOrStatus.message.toLowerCase().includes('aborted') ||
        errorOrStatus.message.toLowerCase().includes('timeout') ||
        errorOrStatus.message.toLowerCase().includes('timed out')))
  ) {
    return {
      status: 504,
      message: stripEmojis(TIMEOUT_MESSAGE),
    };
  }

  // Check for Rate Limit / Quota Exhaustion (HTTP 429 / RESOURCE_EXHAUSTED)
  const isRateLimitStatus = errorOrStatus === 429;
  const bodyText = typeof responseBody === 'string' ? responseBody : '';
  const isResourceExhaustedBody =
    bodyText.includes('RESOURCE_EXHAUSTED') ||
    bodyText.includes('RATE_LIMIT_EXCEEDED') ||
    bodyText.includes('429');
  const isRateLimitError =
    errorOrStatus instanceof Error &&
    (errorOrStatus.message.includes('429') ||
      errorOrStatus.message.includes('RESOURCE_EXHAUSTED'));

  if (isRateLimitStatus || isResourceExhaustedBody || isRateLimitError) {
    return {
      status: 429,
      message: stripEmojis(RATE_LIMIT_MESSAGE),
    };
  }

  // Check for upstream outages (500, 502, 503, UNAVAILABLE)
  const isUpstreamOutageStatus =
    typeof errorOrStatus === 'number' &&
    (errorOrStatus === 500 || errorOrStatus === 502 || errorOrStatus === 503);
  const isUnavailableBody =
    bodyText.includes('UNAVAILABLE') || bodyText.includes('"code": 503');

  if (isUpstreamOutageStatus || isUnavailableBody) {
    return {
      status: 503,
      message: stripEmojis(UPSTREAM_OUTAGE_MESSAGE),
    };
  }

  // Generic exception fallback
  return {
    status: 500,
    message: stripEmojis(GENERIC_ERROR_MESSAGE),
  };
}
