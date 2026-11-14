# Data Model: Dual SMS Overdue Balance Reminders (ARL-22)

**Feature Key**: `ARL-22`  
**Feature Slug**: `015-dual-sms-overdue-balance-reminders`  
**Jira Story**: STORY-4.5: Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle  

---

## 1. Domain Entities & Entity Relationships

```mermaid
erDiagram
    SYSTEM_SETTINGS ||--o{ SMS_DISPATCH_RECORD : "configures"
    CUSTOMER ||--o{ SALE : "incurs credit via"
    SALE ||--o{ SMS_DISPATCH_RECORD : "triggers"
    CUSTOMER ||--o{ SMS_DISPATCH_RECORD : "receives"

    SYSTEM_SETTINGS {
        string id PK
        int reminder_days
        string admin_mobile
        string notification_channel
        boolean notify_customer_sms
        string customer_sms_template
        string updated_at
    }

    SALE {
        string id PK
        string receipt_number
        string customer_id FK
        number total_amount
        number amount_paid
        number balance
        string payment_status
        string created_at
        string last_sms_sent_at
    }

    CUSTOMER {
        string id PK
        string name
        string phone
        string address
    }

    SMS_DISPATCH_RECORD {
        string id PK
        string sale_id FK
        string customer_id FK
        string recipient_mobile
        string recipient_type
        string message_body
        string status
        string sent_at
    }
```

---

## 2. TypeScript Data Transfer Objects (DTOs) & Contracts

### 2.1 System Settings Extension
```typescript
export interface SystemSettingsDTO {
  id: string;
  reminder_days: number;
  admin_mobile: string;
  notification_channel: string;
  notify_customer_sms: boolean;
  customer_sms_template?: string | null;
  updated_at: string;
}

export interface ReminderSettingsInput {
  reminder_days: number;
  admin_mobile: string;
  notification_channel: 'SMS';
  notify_customer_sms: boolean;
  customer_sms_template?: string | null;
}
```

### 2.2 SMS Dispatch Types
```typescript
export type SmsRecipientType = 'ADMIN' | 'CUSTOMER';

export interface SmsDispatchPayload {
  recipientMobile: string;
  recipientType: SmsRecipientType;
  message: string;
  saleId?: string;
  receiptNumber?: string;
  customerId?: string;
  customerName?: string;
}

export interface SmsDispatchResult {
  success: boolean;
  messageId?: string;
  recipientMobile: string;
  recipientType: SmsRecipientType;
  timestamp: string;
  error?: string;
}

export interface ManualSmsNudgeInput {
  saleId?: string;
  customerId?: string;
}

export interface OverdueSweepResult {
  salesEvaluated: number;
  adminSmsDispatched: number;
  customerSmsDispatched: number;
  customerSmsSkipped: number;
  details: Array<{
    saleId: string;
    receiptNumber: string;
    adminSuccess: boolean;
    customerSuccess?: boolean;
    customerSkippedReason?: string;
  }>;
}
```

---

## 3. Storage & Schema Migration

```sql
-- Migration: Add customer SMS reminder toggle and audit timestamp
ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS notify_customer_sms BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_sms_template TEXT NULL;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS last_sms_sent_at TIMESTAMPTZ NULL;
```

