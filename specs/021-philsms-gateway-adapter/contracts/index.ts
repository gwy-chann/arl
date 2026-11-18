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
