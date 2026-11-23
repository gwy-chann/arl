import { z } from 'zod';

export const TEXTBEE_DEFAULT_BASE_URL = 'https://api.textbee.dev/api/v1';
export const TEXTBEE_DEFAULT_DEVICE_NAME = 'ARLQ Android SMS Gateway';

export const textBeeHealthLevelSchema = z.enum([
  'healthy',
  'warning',
  'critical',
  'mock',
  'error',
]);

export type TextBeeHealthLevel = z.infer<typeof textBeeHealthLevelSchema>;

export const textBeeNetworkTypeSchema = z.enum([
  'WIFI',
  'CELLULAR',
  'ETHERNET',
  'NONE',
  'UNKNOWN',
]);

export type TextBeeNetworkType = z.infer<typeof textBeeNetworkTypeSchema>;

export const textBeeDeviceHealthSchema = z.object({
  success: z.boolean(),
  deviceId: z.string(),
  deviceName: z.string(),
  deviceModel: z.string().optional(),
  isOnline: z.boolean(),
  batteryPercentage: z.number().min(0).max(100),
  isCharging: z.boolean(),
  networkType: textBeeNetworkTypeSchema,
  signalStrength: z.number().optional(),
  lastSeenAt: z.string(),
  warningLevel: textBeeHealthLevelSchema,
  statusText: z.string(),
  isMock: z.boolean(),
  cached: z.boolean(),
  cachedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type TextBeeDeviceHealth = z.infer<typeof textBeeDeviceHealthSchema>;

export interface GetTextBeeHealthOptions {
  forceRefresh?: boolean;
}

export interface TextBeeRawDeviceApiResponse {
  id?: string;
  _id?: string;
  name?: string;
  model?: string;
  status?: string;
  online?: boolean;
  battery?:
    | {
        percentage?: number;
        level?: number;
        isCharging?: boolean;
        charging?: boolean;
      }
    | number;
  batteryLevel?: number;
  isCharging?: boolean;
  network?:
    | {
        type?: string;
        signal?: number;
      }
    | string;
  networkType?: string;
  lastSeen?: string;
  updatedAt?: string;
  createdAt?: string;
}

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
  recipient: z.string(),
  gateway: z.literal('TEXTBEE'),
  errorMessage: z.string().optional(),
  errorCode: textBeeErrorCodeSchema.optional(),
  rawResponse: z.unknown().optional(),
});

export type TextBeeSendResult = z.infer<typeof textBeeSendResultSchema>;

export interface TextBeeMockRecord {
  recipient: string;
  message: string;
  timestamp: string;
  messageId: string;
  deviceId?: string;
}
