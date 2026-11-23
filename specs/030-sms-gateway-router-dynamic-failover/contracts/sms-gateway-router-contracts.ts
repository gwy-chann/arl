/**
 * Pluggable Multi-Gateway Router Contracts
 * Jira: ARL-41 / STORY-6.2
 */

export type SmsGatewayProvider = 'textbee' | 'philsms' | 'mock';

export interface UnifiedSmsDispatchOptions {
  recipient: string;
  message: string;
  senderId?: string;
  signal?: AbortSignal;
  provider?: SmsGatewayProvider | string;
}

export interface UnifiedSmsDispatchResult {
  success: boolean;
  messageId?: string;
  provider: SmsGatewayProvider;
  errorMessage?: string;
  errorCode?: string;
  rawResponse?: unknown;
}

export interface SmsGatewayRouter {
  resolveProvider(options?: UnifiedSmsDispatchOptions): SmsGatewayProvider;
  dispatch(options: UnifiedSmsDispatchOptions): Promise<UnifiedSmsDispatchResult>;
}
