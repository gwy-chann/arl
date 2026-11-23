import { z } from 'zod';

export const textBeeErrorCodeSchema = z.enum([
  'DEVICE_OFFLINE',
  'DEVICE_NOT_FOUND',
  'GATEWAY_AUTH_ERROR',
  'GATEWAY_BAD_REQUEST',
  'GATEWAY_RATE_LIMITED',
  'GATEWAY_SERVER_ERROR',
  'NETWORK_UNREACHABLE',
  'TIMEOUT',
  'INVALID_RECIPIENT_MOBILE',
]);

export type TextBeeErrorCode = z.infer<typeof textBeeErrorCodeSchema>;

export const textBeeSendOptionsSchema = z.object({
  recipient: z.string().min(1, 'Recipient phone number is required'),
  message: z.string().min(1, 'SMS message body is required'),
  deviceId: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

export type TextBeeSendOptions = z.infer<typeof textBeeSendOptionsSchema> & {
  signal?: AbortSignal;
};

export const textBeeSendResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  errorMessage: z.string().optional(),
  errorCode: textBeeErrorCodeSchema.optional(),
  rawResponse: z.unknown().optional(),
});

export type TextBeeSendResult = z.infer<typeof textBeeSendResultSchema>;
