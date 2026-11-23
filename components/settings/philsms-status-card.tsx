'use client';

import {
  SmsGatewayStatusCard,
  type SmsGatewayStatusCardProps,
} from './sms-status-card';
import type { PhilSmsAccountStatus } from '@/lib/services/philsms-contracts';

export interface PhilSmsStatusCardProps {
  initialStatus: PhilSmsAccountStatus;
}

/**
 * Backward-compatible wrapper component delegating to the flexible SmsGatewayStatusCard.
 */
export function PhilSmsStatusCard({ initialStatus }: Readonly<PhilSmsStatusCardProps>) {
  return (
    <SmsGatewayStatusCard
      initialPhilSmsStatus={initialStatus}
      defaultGateway="PHILSMS"
    />
  );
}

export type { SmsGatewayStatusCardProps };
