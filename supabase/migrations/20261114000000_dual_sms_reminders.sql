-- Migration: 20261114000000_dual_sms_reminders.sql
-- Feature: ARL-22 (Dual SMS Overdue Balance Reminders for Admin & Customer with Manual Nudge and Settings Toggle)

-- 1. Extend system_settings with customer SMS configuration
ALTER TABLE public.system_settings
    ADD COLUMN IF NOT EXISTS notify_customer_sms BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS customer_sms_template TEXT NULL;

-- 2. Extend sales with last_sms_sent_at for rate limiting and dispatch audit
ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS last_sms_sent_at TIMESTAMPTZ NULL;

-- 3. Optional index on sales for overdue balance queries with last_sms_sent_at
CREATE INDEX IF NOT EXISTS idx_sales_overdue_sms_sweep 
    ON public.sales (payment_status, balance, created_at, last_sms_sent_at)
    WHERE balance > 0;

