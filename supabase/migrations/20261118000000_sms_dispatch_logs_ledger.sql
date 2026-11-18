-- Migration: 20261118000000_sms_dispatch_logs_ledger.sql
-- Feature: ARL-26 (SMS Dispatch & Delivery Audit Ledger with Message ID Tracking)

-- 1. Create sms_dispatch_logs immutable audit table
CREATE TABLE IF NOT EXISTS public.sms_dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    recipient_mobile VARCHAR(20) NOT NULL,
    recipient_type VARCHAR(10) NOT NULL CHECK (recipient_type IN ('ADMIN', 'CUSTOMER')),
    message_body TEXT NOT NULL,
    gateway_name VARCHAR(20) NOT NULL DEFAULT 'PHILSMS',
    gateway_message_id VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
    error_reason TEXT NULL,
    latency_ms INTEGER NULL,
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance & Analytical Indexes
CREATE INDEX IF NOT EXISTS idx_sms_dispatch_logs_sale_id 
    ON public.sms_dispatch_logs(sale_id);

CREATE INDEX IF NOT EXISTS idx_sms_dispatch_logs_customer_id 
    ON public.sms_dispatch_logs(customer_id);

CREATE INDEX IF NOT EXISTS idx_sms_dispatch_logs_status_dispatched 
    ON public.sms_dispatch_logs(status, dispatched_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_dispatch_logs_gateway_msg_id 
    ON public.sms_dispatch_logs(gateway_message_id);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.sms_dispatch_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read sms_dispatch_logs" ON public.sms_dispatch_logs;
CREATE POLICY "Allow authenticated read sms_dispatch_logs"
    ON public.sms_dispatch_logs
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert sms_dispatch_logs" ON public.sms_dispatch_logs;
CREATE POLICY "Allow authenticated insert sms_dispatch_logs"
    ON public.sms_dispatch_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 4. Immutability Protection: Disallow UPDATE and DELETE operations
CREATE OR REPLACE FUNCTION public.prevent_sms_dispatch_logs_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'sms_dispatch_logs is an immutable audit ledger. UPDATE and DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_sms_dispatch_logs_mutation ON public.sms_dispatch_logs;
CREATE TRIGGER trg_prevent_sms_dispatch_logs_mutation
    BEFORE UPDATE OR DELETE ON public.sms_dispatch_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_sms_dispatch_logs_mutation();
