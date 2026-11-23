# Component & Service Contracts: TextBee Device Connection Health Diagnostic

**Feature Key**: `ARL-43`  
**Feature Slug**: `028-textbee-device-health-diagnostic`  

---

## 1. Zod Validation Schemas

```typescript
import { z } from 'zod';

export const textBeeHealthLevelSchema = z.enum([
  'healthy',
  'warning',
  'critical',
  'mock',
  'error',
]);

export const textBeeNetworkTypeSchema = z.enum([
  'WIFI',
  'CELLULAR',
  'ETHERNET',
  'NONE',
  'UNKNOWN',
]);

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
```

---

## 2. Server Action Contracts (`app/(admin)/settings/reminders/actions.ts`)

```typescript
export interface TextBeeDeviceHealthActionResult {
  success: boolean;
  data?: TextBeeDeviceHealth;
  error?: string;
}

export interface SmsGatewayStatusActionResult {
  success: boolean;
  activeGateway: 'PHILSMS' | 'TEXTBEE' | 'DUAL';
  philsms?: PhilSmsAccountStatus;
  textbee?: TextBeeDeviceHealth;
  error?: string;
}
```

---

## 3. UI Component Props (`components/settings/sms-status-card.tsx`)

```typescript
export interface SmsGatewayStatusCardProps {
  initialPhilSmsStatus?: PhilSmsAccountStatus | null;
  initialTextBeeStatus?: TextBeeDeviceHealth | null;
  defaultGateway?: 'PHILSMS' | 'TEXTBEE';
}
```
