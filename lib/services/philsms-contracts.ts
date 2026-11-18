import { z } from 'zod';

export type PhilSmsErrorCode =
  | 'INVALID_RECIPIENT_MOBILE'
  | 'GATEWAY_BAD_REQUEST'
  | 'GATEWAY_AUTH_ERROR'
  | 'INSUFFICIENT_CREDITS'
  | 'GATEWAY_RATE_LIMITED'
  | 'NETWORK_UNREACHABLE'
  | 'GATEWAY_UNKNOWN_ERROR';

/**
 * Standard PhilSMS recipient phone format: exactly 12 digits starting with 639
 */
export const PHILSMS_CANONICAL_MOBILE_REGEX = /^639\d{9}$/;

export const philsmsCanonicalMobileSchema = z
  .string()
  .trim()
  .regex(PHILSMS_CANONICAL_MOBILE_REGEX, {
    message: 'PhilSMS recipient mobile must be 12 digits starting with 639 (e.g., 639171234567)',
  });

/**
 * PhilSMS v3 REST API Send Request Body
 */
export const philsmsSendRequestSchema = z.object({
  recipient: philsmsCanonicalMobileSchema,
  sender_id: z.string().trim().min(1).default('PhilSMS'),
  type: z.literal('plain').default('plain'),
  message: z.string().min(1, 'Message body cannot be empty'),
});

export type PhilSmsSendRequest = z.infer<typeof philsmsSendRequestSchema>;

/**
 * PhilSMS v3 API response schemas
 */
export const philsmsSuccessDataSchema = z.object({
  uid: z.string(),
  to: z.string(),
  message: z.string(),
  cost: z.number().optional(),
  status: z.string().optional(),
});

export const philsmsSendResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string().optional(),
  data: philsmsSuccessDataSchema.optional(),
});

export type PhilSmsApiResponse = z.infer<typeof philsmsSendResponseSchema>;
export type PhilSmsSuccessData = z.infer<typeof philsmsSuccessDataSchema>;

export interface PhilSmsSendOptions {
  recipient: string;
  message: string;
  senderId?: string;
  bypassNormalization?: boolean;
  signal?: AbortSignal;
}

export interface PhilSmsSendResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  senderId: string;
  cost?: number;
  encoding: 'GSM-7' | 'UCS-2';
  segments: number;
  errorCode?: PhilSmsErrorCode;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface Gsm7EncodingSummary {
  encoding: 'GSM-7' | 'UCS-2';
  characterCount: number;
  segmentCount: number;
  estimatedCredits: number;
  hasNonGsmCharacters: boolean;
  nonGsmCharacters?: string[];
}

export interface PhilSmsMockRecord {
  id: string;
  recipient: string;
  senderId: string;
  message: string;
  timestamp: string;
  encoding: 'GSM-7' | 'UCS-2';
  segments: number;
}

export interface PhilSmsAccountBalance {
  balance: number;
  currency: string;
  status: string;
}

export type PhilSmsHealthLevel = 'healthy' | 'warning' | 'critical' | 'mock' | 'error';

export interface PhilSmsAccountStatus {
  success: boolean;
  balance: number;
  currency: string;
  senderId: string;
  isMock: boolean;
  cached: boolean;
  cachedAt?: string;
  expiresAt?: string;
  warningLevel: PhilSmsHealthLevel;
  statusText: string;
  errorMessage?: string;
}

export interface GetPhilSmsBalanceOptions {
  forceRefresh?: boolean;
}

export const philsmsBalanceDataSchema = z.object({
  balance: z.union([z.string(), z.number()]).optional(),
  remaining_balance: z.union([z.string(), z.number()]).optional(),
  currency: z.string().default('PHP'),
  sender_id: z.string().optional(),
  expired_on: z.string().optional(),
});

export const philsmsBalanceResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string().optional(),
  data: philsmsBalanceDataSchema.optional(),
});

/**
 * Telecom Encoding Constants
 */
export const GSM7_SINGLE_MAX = 160;
export const GSM7_CONCAT_MAX = 153;
export const UCS2_SINGLE_MAX = 70;
export const UCS2_CONCAT_MAX = 67;

export const PHILSMS_DEFAULT_BASE_URL = 'https://app.philsms.com/api/v3';
export const PHILSMS_DEFAULT_SENDER_ID = 'PhilSMS';

/**
 * Standard GSM 7-bit Default Alphabet & Extension Tables (GSM 03.38)
 */
export const GSM7_BASIC_CHARS = new Set([
  '@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r', 'Å', 'å',
  'Δ', '_', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ', 'Æ', 'æ', 'ß', 'É',
  ' ', '!', '"', '#', '¤', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
  '¡', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§',
  '¿', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ñ', 'ü', 'à',
]);

export const GSM7_EXTENDED_CHARS = new Set([
  '^', '{', '}', '\\', '[', '~', ']', '|', '€',
]);
